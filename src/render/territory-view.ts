import * as THREE from 'three';
import { config } from '../config';
import type { Pawn } from '../pawn';
import type { Territory } from '../territory';

const DEG = Math.PI / 180;

const VERTEX_DECL = /* glsl */ `
attribute float countryId;
varying vec3 vGridDir;
flat varying float vCountry;
`;

/**
 * Peinture des zones dans le shader. Même convention de grille que src/cube-grid.ts.
 *
 * Chaque pixel connaît son vrai pays (attribut du maillage), donc la peinture ne déborde jamais
 * d'une frontière :
 * - pays entièrement à un joueur → peint en entier, exactement jusqu'aux frontières ;
 * - pays que personne n'a touché → rien à lire ;
 * - pays partagé → on lit la grille, mais seules les cases de ce pays votent. Le vote pondéré
 *   des 4 cases voisines lisse le contour intérieur de la zone.
 */
const FRAGMENT_DECL = /* glsl */ `
varying vec3 vGridDir;
flat varying float vCountry;
uniform sampler2D uGrid;
uniform sampler2D uCountryGrid;
uniform sampler2D uCountryState;
uniform vec4 uFlipIds;
uniform float uFlip;
uniform float uGridN;
uniform vec3 uPlayerColors[7];
uniform float uPulse;

float gridWarp(float t) { return atan(t) * 1.2732395447; }

// Les 6 faces sont empilées dans une texture de n × 6n : une seule lecture, sans branchement.
vec2 gridUv(float face, vec2 texel) {
  vec2 t = clamp(texel, vec2(0.0), vec2(uGridN - 1.0)) + 0.5;
  return vec2(t.x / uGridN, (face * uGridN + t.y) / (6.0 * uGridN));
}
float gridOwner(float face, vec2 texel) {
  return floor(texture2D(uGrid, gridUv(face, texel)).r * 255.0 + 0.5);
}
float gridCountry(float face, vec2 texel) {
  return floor(texture2D(uCountryGrid, gridUv(face, texel)).r * 255.0 + 0.5);
}

// Renvoie (propriétaire, poids du vote) pour un pixel du pays country.
vec2 zoneAt(vec3 d, float country) {
  vec3 a = abs(d);
  float face;
  vec2 uv;
  if (a.x >= a.y && a.x >= a.z) { face = d.x > 0.0 ? 0.0 : 1.0; uv = d.yz / a.x; }
  else if (a.y >= a.z) { face = d.y > 0.0 ? 2.0 : 3.0; uv = d.zx / a.y; }
  else { face = d.z > 0.0 ? 4.0 : 5.0; uv = d.xy / a.z; }
  vec2 p = (vec2(gridWarp(uv.x), gridWarp(uv.y)) * 0.5 + 0.5) * uGridN - 0.5;
  vec2 base = floor(p);
  vec2 f = p - base;
  vec2 b1 = base + vec2(1.0, 0.0);
  vec2 b2 = base + vec2(0.0, 1.0);
  vec2 b3 = base + vec2(1.0, 1.0);
  vec4 ids = vec4(gridOwner(face, base), gridOwner(face, b1), gridOwner(face, b2), gridOwner(face, b3));
  vec4 w = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
  // La mer (255) ne vote pas.
  w *= step(ids, vec4(254.5));
  // Seules les cases du pays du pixel votent ; s'il n'y en a aucune (liseré très fin), toutes votent.
  vec4 cids = vec4(gridCountry(face, base), gridCountry(face, b1), gridCountry(face, b2), gridCountry(face, b3));
  vec4 same = w * step(abs(cids - vec4(country)), vec4(0.5));
  if (same.x + same.y + same.z + same.w > 0.0) w = same;
  float total = w.x + w.y + w.z + w.w;
  if (total <= 0.0) return vec2(0.0, 1.0);
  float best = 0.0;
  float bestW = -1.0;
  for (int i = 0; i < 4; i++) {
    float id = ids[i];
    float s = dot(w, vec4(equal(ids, vec4(id))));
    if (w[i] > 0.0 && s > bestW) { bestW = s; best = id; }
  }
  return vec2(best, bestW / total);
}
`;

const FRAGMENT_COLOR = /* glsl */ `
#include <color_fragment>
{
  float country = floor(vCountry + 0.5);
  // État du pays : 0 = personne, 1..6 = entièrement à ce joueur, 254 = partagé.
  float state = floor(texture2D(uCountryState, vec2((country + 0.5) / 256.0, 0.5)).r * 255.0 + 0.5);
  vec2 zone = vec2(state, 1.0);
  if (state > 200.0) zone = zoneAt(normalize(vGridDir), country);
  int who = int(zone.x + 0.5);
  if (who > 0 && who < 7) {
    vec3 paint = uPlayerColors[who];
    // Liseré plus sombre au bord de la zone, éclat bref à la capture.
    float edge = 1.0 - smoothstep(0.5, 0.62, zone.y);
    paint *= 1.0 - 0.3 * edge;
    paint += vec3(uPulse * 0.25);
    // Pays qui vient de basculer : éclat blanc qui s'estompe.
    if (uFlip > 0.0 && any(equal(vec4(country), uFlipIds))) paint = mix(paint, vec3(1.0), uFlip * 0.85);
    diffuseColor.rgb = mix(diffuseColor.rgb, paint, 0.88);
  }
}
`;

/** Matériau des terres + textures de la grille : peint les zones possédées. */
export class TerritoryView {
  readonly landMaterial: THREE.MeshLambertMaterial;
  private readonly texture: THREE.DataTexture;
  private readonly pulse = { value: 0 };
  private readonly flip = { value: 0 };
  private readonly flipIds = { value: new THREE.Vector4(-1, -1, -1, -1) };
  private readonly countryTexture: THREE.DataTexture;
  private readonly stateTexture: THREE.DataTexture;

  constructor(private readonly territory: Territory) {
    const n = territory.n;
    // La table des propriétaires sert directement de texture (n × 6n), sans copie.
    this.texture = new THREE.DataTexture(territory.owner, n, 6 * n, THREE.RedFormat, THREE.UnsignedByteType);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.unpackAlignment = 1;
    this.texture.needsUpdate = true;

    // Table « case → pays », fixe : sert à repérer dans le shader les pays qui basculent.
    this.countryTexture = new THREE.DataTexture(territory.country, n, 6 * n, THREE.RedFormat, THREE.UnsignedByteType);
    this.countryTexture.magFilter = THREE.NearestFilter;
    this.countryTexture.minFilter = THREE.NearestFilter;
    this.countryTexture.generateMipmaps = false;
    this.countryTexture.unpackAlignment = 1;
    this.countryTexture.needsUpdate = true;

    // État de chaque pays (voir Territory.countryState) : une ligne de 256 valeurs.
    this.stateTexture = new THREE.DataTexture(territory.countryState, 256, 1, THREE.RedFormat, THREE.UnsignedByteType);
    this.stateTexture.magFilter = THREE.NearestFilter;
    this.stateTexture.minFilter = THREE.NearestFilter;
    this.stateTexture.generateMipmaps = false;
    this.stateTexture.unpackAlignment = 1;
    this.stateTexture.needsUpdate = true;

    const colors = [new THREE.Color(0), ...config.playerColors.map((c) => new THREE.Color(c))];
    while (colors.length < 7) colors.push(new THREE.Color(0xffffff));

    this.landMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.landMaterial.onBeforeCompile = (shader) => {
      shader.uniforms['uGrid'] = { value: this.texture };
      shader.uniforms['uCountryGrid'] = { value: this.countryTexture };
      shader.uniforms['uCountryState'] = { value: this.stateTexture };
      shader.uniforms['uFlip'] = this.flip;
      shader.uniforms['uFlipIds'] = this.flipIds;
      shader.uniforms['uGridN'] = { value: n };
      shader.uniforms['uPlayerColors'] = { value: colors };
      shader.uniforms['uPulse'] = this.pulse;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${VERTEX_DECL}`)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGridDir = position;\nvCountry = countryId;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FRAGMENT_DECL}`)
        .replace('#include <color_fragment>', FRAGMENT_COLOR);
    };
  }

  /** Déclenche l'éclat de capture. */
  flash(): void {
    this.pulse.value = 1;
  }

  /** Fait briller les pays qui viennent de basculer (4 au plus à la fois). */
  flashCountries(countries: readonly number[]): void {
    if (countries.length === 0) return;
    this.flipIds.value.set(countries[0] ?? -1, countries[1] ?? -1, countries[2] ?? -1, countries[3] ?? -1);
    this.flip.value = 1;
  }

  /** À appeler à chaque image : envoie au GPU les faces modifiées, fait décroître l'éclat. */
  update(frameTime: number): void {
    if (this.territory.dirty) {
      this.territory.dirty = false;
      this.territory.refreshCountryState();
      this.texture.needsUpdate = true;
      this.stateTexture.needsUpdate = true;
    }
    this.pulse.value = Math.max(0, this.pulse.value - frameTime / config.capturePulseTime);
    this.flip.value = Math.max(0, this.flip.value - frameTime / config.flipFlashTime);
  }
}

/** Dessine une empreinte de patte (un coussinet et quatre doigts) dans une texture. */
function pawTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff';
    const blob = (x: number, y: number, rx: number, ry: number): void => {
      ctx.beginPath();
      ctx.ellipse(x * size, y * size, rx * size, ry * size, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    // L'avant de la patte est en haut de la texture.
    blob(0.5, 0.66, 0.24, 0.2);
    blob(0.2, 0.4, 0.09, 0.12);
    blob(0.4, 0.22, 0.09, 0.12);
    blob(0.6, 0.22, 0.09, 0.12);
    blob(0.8, 0.4, 0.09, 0.12);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Traînée d'empreintes : une patte à gauche, une à droite, tout le long du trajet hors zone. */
export class FootprintsView {
  readonly mesh: THREE.InstancedMesh;
  private count = 0;
  private leftNext = true;
  private readonly last = new THREE.Vector3();
  private readonly side = new THREE.Vector3();
  private readonly at = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();

  constructor() {
    // Quad dans le plan XZ local : X = côté, Z = avant, Y = ciel.
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    // Après rotation, le haut de la texture pointe vers −Z : on retourne pour qu'il pointe vers l'avant.
    geo.rotateY(Math.PI);
    const mat = new THREE.MeshBasicMaterial({
      map: pawTexture(),
      color: config.footprintColor,
      transparent: true,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, config.footprintMax);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
  }

  clear(): void {
    this.count = 0;
    this.mesh.count = 0;
  }

  /** À appeler à chaque pas de simulation tant que le pion est hors de sa zone. */
  record(pawn: Pawn): void {
    if (this.count > 0 && this.last.angleTo(pawn.pos) < config.footprintSpacingDeg * DEG) return;
    if (this.count >= config.footprintMax) return;
    this.last.copy(pawn.pos);

    this.side.crossVectors(pawn.pos, pawn.heading);
    const offset = (this.leftNext ? -1 : 1) * config.footprintOffsetDeg * DEG;
    this.leftNext = !this.leftNext;
    const r = 1 + config.landHeight + 0.0012;
    this.at.copy(pawn.pos).addScaledVector(this.side, offset).normalize().multiplyScalar(r);

    const s = config.footprintSizeDeg * DEG;
    this.matrix.makeBasis(this.side, pawn.pos, pawn.heading);
    this.matrix.scale(this.scale.set(s, s, s));
    this.matrix.setPosition(this.at);
    this.mesh.setMatrixAt(this.count++, this.matrix);
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
