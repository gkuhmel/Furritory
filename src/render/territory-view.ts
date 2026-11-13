import * as THREE from 'three';
import { config } from '../config';
import type { Pawn } from '../pawn';
import type { Territory } from '../territory';

const DEG = Math.PI / 180;

const VERTEX_DECL = /* glsl */ `
varying vec3 vGridDir;
`;

/**
 * Lecture de la grille dans le shader. Même convention que src/cube-grid.ts.
 * Le propriétaire d'un pixel est choisi par vote pondéré des 4 cases voisines :
 * les contours de zone sont lissés au lieu d'être en escalier. La mer ne vote pas.
 */
const FRAGMENT_DECL = /* glsl */ `
varying vec3 vGridDir;
uniform sampler2D uGrid;
uniform float uGridN;
uniform vec3 uPlayerColors[7];
uniform float uPulse;

float gridWarp(float t) { return atan(t) * 1.2732395447; }

// Les 6 faces sont empilées dans une seule texture de n × 6n : une seule lecture, sans branchement.
float gridOwner(float face, vec2 texel) {
  vec2 t = clamp(texel, vec2(0.0), vec2(uGridN - 1.0)) + 0.5;
  return floor(texture2D(uGrid, vec2(t.x / uGridN, (face * uGridN + t.y) / (6.0 * uGridN))).r * 255.0 + 0.5);
}

// Renvoie (propriétaire, poids du vote).
vec2 zoneAt(vec3 d) {
  vec3 a = abs(d);
  float face;
  vec2 uv;
  if (a.x >= a.y && a.x >= a.z) { face = d.x > 0.0 ? 0.0 : 1.0; uv = d.yz / a.x; }
  else if (a.y >= a.z) { face = d.y > 0.0 ? 2.0 : 3.0; uv = d.zx / a.y; }
  else { face = d.z > 0.0 ? 4.0 : 5.0; uv = d.xy / a.z; }
  vec2 p = (vec2(gridWarp(uv.x), gridWarp(uv.y)) * 0.5 + 0.5) * uGridN - 0.5;
  vec2 base = floor(p);
  vec2 f = p - base;
  vec4 ids = vec4(
    gridOwner(face, base),
    gridOwner(face, base + vec2(1.0, 0.0)),
    gridOwner(face, base + vec2(0.0, 1.0)),
    gridOwner(face, base + vec2(1.0, 1.0)));
  vec4 w = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
  // Cas le plus courant, loin de tout bord de zone : les 4 cases sont identiques.
  if (ids.x == ids.y && ids.x == ids.z && ids.x == ids.w) return vec2(ids.x > 254.5 ? 0.0 : ids.x, 1.0);
  // La mer (255) ne vote pas.
  w *= step(ids, vec4(254.5));
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
  vec2 zone = zoneAt(normalize(vGridDir));
  int who = int(zone.x + 0.5);
  if (who > 0 && who < 7) {
    vec3 paint = uPlayerColors[who];
    // Liseré plus sombre au bord de la zone, éclat bref à la capture.
    float edge = 1.0 - smoothstep(0.5, 0.62, zone.y);
    paint *= 1.0 - 0.3 * edge;
    paint += vec3(uPulse * 0.45);
    diffuseColor.rgb = mix(diffuseColor.rgb, paint, 0.88);
  }
}
`;

/** Matériau des terres + textures de la grille : peint les zones possédées. */
export class TerritoryView {
  readonly landMaterial: THREE.MeshLambertMaterial;
  private readonly texture: THREE.DataTexture;
  private readonly pulse = { value: 0 };

  constructor(private readonly territory: Territory) {
    const n = territory.n;
    // La table des propriétaires sert directement de texture (n × 6n), sans copie.
    this.texture = new THREE.DataTexture(territory.owner, n, 6 * n, THREE.RedFormat, THREE.UnsignedByteType);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.unpackAlignment = 1;
    this.texture.needsUpdate = true;

    const colors = [new THREE.Color(0), ...config.playerColors.map((c) => new THREE.Color(c))];
    while (colors.length < 7) colors.push(new THREE.Color(0xffffff));

    this.landMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.landMaterial.onBeforeCompile = (shader) => {
      shader.uniforms['uGrid'] = { value: this.texture };
      shader.uniforms['uGridN'] = { value: n };
      shader.uniforms['uPlayerColors'] = { value: colors };
      shader.uniforms['uPulse'] = this.pulse;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${VERTEX_DECL}`)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGridDir = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FRAGMENT_DECL}`)
        .replace('#include <color_fragment>', FRAGMENT_COLOR);
    };
  }

  /** Déclenche l'éclat de capture. */
  flash(): void {
    this.pulse.value = 1;
  }

  /** À appeler à chaque image : envoie au GPU les faces modifiées, fait décroître l'éclat. */
  update(frameTime: number): void {
    if (this.territory.dirty) {
      this.territory.dirty = false;
      this.texture.needsUpdate = true;
    }
    this.pulse.value = Math.max(0, this.pulse.value - frameTime / config.capturePulseTime);
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
