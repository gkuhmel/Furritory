import * as THREE from 'three';
import { config } from '../config';
import type { LonLat, World } from '../world';

const DEG = Math.PI / 180;

/** Convertit (longitude, latitude) en point 3D à la distance `r` du centre. Y = pôle Nord. */
function pushPoint(out: number[], lon: number, lat: number, r: number): void {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  const c = Math.cos(phi);
  out.push(r * c * Math.sin(lambda), r * Math.sin(phi), r * c * Math.cos(lambda));
}

/** Écart angulaire (degrés) entre deux points lon/lat. */
function angularDeg(a: LonLat, b: LonLat): number {
  const p1 = a[1] * DEG;
  const p2 = b[1] * DEG;
  const dl = (b[0] - a[0]) * DEG;
  const cos = Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl);
  return Math.acos(Math.min(1, Math.max(-1, cos))) / DEG;
}

function mid(a: LonLat, b: LonLat): LonLat {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * Rend une suite de points continue en longitude : un saut de plus de 180° entre deux points
 * voisins est un passage de l'antiméridien, qu'on déroule (la longitude peut alors dépasser ±180).
 */
function unwrap(points: LonLat[]): LonLat[] {
  let offset = 0;
  let prev = points[0]?.[0] ?? 0;
  return points.map((p) => {
    const jump = p[0] - prev;
    if (jump > 180) offset -= 360;
    else if (jump < -180) offset += 360;
    prev = p[0];
    return [p[0] + offset, p[1]];
  });
}

/**
 * Un anneau déroulé qui ne se referme pas en longitude fait le tour d'un pôle (Antarctique) :
 * on le referme en passant par ce pôle.
 */
function closeOverPole(ring: LonLat[]): LonLat[] {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last || Math.abs(first[0] - last[0]) < 180) return ring;
  let sum = 0;
  for (const p of ring) sum += p[1];
  const pole = sum < 0 ? -90 : 90;
  return [...ring, [last[0], pole], [first[0], pole]];
}

export interface Globe {
  group: THREE.Group;
  /** Nombre de triangles générés (pour le panneau de debug). */
  triangles: number;
}

/**
 * Construit le globe-plateau : mer lisse, terres en léger relief découpées pays par pays,
 * tranche visible le long des côtes, frontières gravées.
 */
export function buildGlobe(world: World, landMaterial: THREE.Material): Globe {
  const group = new THREE.Group();
  const rTop = 1 + config.landHeight;

  // --- Mer ---
  const sea = new THREE.Mesh(
    new THREE.SphereGeometry(1, config.seaSegments, Math.round(config.seaSegments * 0.75)),
    new THREE.MeshLambertMaterial({ color: config.seaColor }),
  );
  group.add(sea);

  // --- Dessus des terres ---
  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();

  // Subdivise un triangle lon/lat jusqu'à ce qu'il épouse la courbure, puis l'émet.
  // La décision se prend arête par arête : deux triangles voisins coupent leur arête commune
  // au même point, ce qui évite toute fente entre eux.
  // Indice du pays de chaque sommet : le shader des zones s'en sert pour respecter les frontières.
  const countryIds: number[] = [];
  let currentCountry = 0;

  const emit = (a: LonLat, b: LonLat, c: LonLat, depth: number): void => {
    const max = config.maxEdgeDeg;
    const sab = depth < 8 && angularDeg(a, b) > max;
    const sbc = depth < 8 && angularDeg(b, c) > max;
    const sca = depth < 8 && angularDeg(c, a) > max;
    const count = Number(sab) + Number(sbc) + Number(sca);
    if (count === 3) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      emit(a, ab, ca, depth + 1);
      emit(ab, b, bc, depth + 1);
      emit(ca, bc, c, depth + 1);
      emit(ab, bc, ca, depth + 1);
      return;
    }
    if (count > 0) {
      // On fait tourner le triangle pour que l'arête a-b soit à couper et que c-a ne le soit pas.
      if (count === 1 ? sbc : sbc && sca) return emit(b, c, a, depth);
      if (count === 1 ? sca : sca && sab) return emit(c, a, b, depth);
      const ab = mid(a, b);
      if (count === 1) {
        emit(a, ab, c, depth + 1);
        emit(ab, b, c, depth + 1);
      } else {
        const bc = mid(b, c);
        emit(a, ab, c, depth + 1);
        emit(ab, bc, c, depth + 1);
        emit(ab, b, bc, depth + 1);
      }
      return;
    }
    pushPoint(positions, a[0], a[1], rTop);
    pushPoint(positions, b[0], b[1], rTop);
    pushPoint(positions, c[0], c[1], rTop);
    for (let i = 0; i < 3; i++) {
      colors.push(color.r, color.g, color.b);
      countryIds.push(currentCountry);
    }
  };

  for (const country of world.countries) {
    currentCountry = country.index;
    // Teinte stable par pays (hachage simple de l'index).
    const palette = config.neutralColors;
    color.setHex(palette[(country.index * 7 + 3) % palette.length] ?? 0xffffff);

    for (const polygon of country.polygons) {
      // Les anneaux GeoJSON répètent leur premier point à la fin : on l'enlève.
      const rings = polygon.map((ring) => closeOverPole(unwrap(ring.slice(0, -1))));
      const outer = rings[0];
      if (!outer || outer.length < 3) continue;
      const holes = rings.slice(1).filter((h) => h.length >= 3);
      const flat: LonLat[] = [outer, ...holes].flat();

      const faces = THREE.ShapeUtils.triangulateShape(
        outer.map((p) => new THREE.Vector2(p[0], p[1])),
        holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1]))),
      );
      for (const face of faces) {
        const a = flat[face[0] ?? 0];
        let b = flat[face[1] ?? 0];
        let c = flat[face[2] ?? 0];
        if (!a || !b || !c) continue;
        // Sens antihoraire en (lon, lat) = face tournée vers l'extérieur du globe.
        const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
        if (area === 0) continue;
        if (area < 0) [b, c] = [c, b];
        emit(a, b, c, 0);
      }
    }
  }

  const landGeo = new THREE.BufferGeometry();
  const landPos = new Float32Array(positions);
  landGeo.setAttribute('position', new THREE.BufferAttribute(landPos, 3));
  // Sur une sphère centrée, la normale est la position normalisée.
  const landNormals = new Float32Array(landPos.length);
  for (let i = 0; i < landPos.length; i += 3) {
    const x = landPos[i] ?? 0;
    const y = landPos[i + 1] ?? 0;
    const z = landPos[i + 2] ?? 0;
    const inv = 1 / Math.hypot(x, y, z);
    landNormals[i] = x * inv;
    landNormals[i + 1] = y * inv;
    landNormals[i + 2] = z * inv;
  }
  landGeo.setAttribute('normal', new THREE.BufferAttribute(landNormals, 3));
  landGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
  landGeo.setAttribute('countryId', new THREE.BufferAttribute(new Float32Array(countryIds), 1));
  const land = new THREE.Mesh(landGeo, landMaterial);
  group.add(land);

  // --- Tranche des terres le long des côtes ---
  const sidePos: number[] = [];
  const sideNorm: number[] = [];
  const up = new THREE.Vector3();
  const along = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const pa: number[] = [];
  const pb: number[] = [];
  forEachSegment(world.coasts, (a, b) => {
    pa.length = 0;
    pb.length = 0;
    pushPoint(pa, a[0], a[1], 1);
    pushPoint(pb, b[0], b[1], 1);
    const [ax = 0, ay = 0, az = 0] = pa;
    const [bx = 0, by = 0, bz = 0] = pb;
    const k = rTop;
    // Deux triangles par segment de côte ; matériau double face, l'ordre importe peu.
    sidePos.push(ax, ay, az, bx, by, bz, bx * k, by * k, bz * k);
    sidePos.push(ax, ay, az, bx * k, by * k, bz * k, ax * k, ay * k, az * k);
    // Normale horizontale, mélangée à la verticale pour que la tranche reste éclairée.
    up.set(ax + bx, ay + by, az + bz).normalize();
    along.set(bx - ax, by - ay, bz - az);
    normal.crossVectors(along, up).normalize().multiplyScalar(0.5).add(up).normalize();
    for (let i = 0; i < 6; i++) sideNorm.push(normal.x, normal.y, normal.z);
  });
  const sideGeo = new THREE.BufferGeometry();
  sideGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sidePos), 3));
  sideGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(sideNorm), 3));
  group.add(
    new THREE.Mesh(
      sideGeo,
      new THREE.MeshLambertMaterial({ color: config.landSideColor, side: THREE.DoubleSide }),
    ),
  );

  // --- Frontières et trait de côte ---
  group.add(buildLines(world.borders, rTop + 0.0006, config.borderColor));
  group.add(buildLines(world.coasts, rTop + 0.0006, config.coastColor));

  return { group, triangles: (positions.length + sidePos.length) / 9 };
}

/** Parcourt des polylignes en segments assez courts pour suivre la courbure. */
function forEachSegment(lines: LonLat[][], fn: (a: LonLat, b: LonLat) => void): void {
  for (const raw of lines) {
    const line = unwrap(raw);
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i];
      const b = line[i + 1];
      if (!a || !b) continue;
      const n = Math.max(1, Math.ceil(angularDeg(a, b) / config.maxEdgeDeg));
      for (let s = 0; s < n; s++) {
        const t0 = s / n;
        const t1 = (s + 1) / n;
        fn(
          [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0],
          [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1],
        );
      }
    }
  }
}

function buildLines(lines: LonLat[][], r: number, color: number): THREE.LineSegments {
  const pos: number[] = [];
  forEachSegment(lines, (a, b) => {
    pushPoint(pos, a[0], a[1], r);
    pushPoint(pos, b[0], b[1], r);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color }));
}
