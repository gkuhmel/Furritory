/**
 * Précalcule la table « case → pays » de la grille de territoire à partir de Natural Earth.
 * Usage : `npm run build:grid` (à relancer seulement si la carte ou la taille de grille change).
 * Sortie : public/world-grid.bin = [n : uint16 LE] puis 6·n² octets (indice du pays, 255 = mer).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { cellToDir, dirToCell, neighbor } from '../src/cube-grid.ts';

/** Cases par côté de face : 256 → cases d'environ 0,35°. */
const N = 256;
const SEA = 255;
const RAD = 180 / Math.PI;

type LonLat = [number, number];
interface Ring {
  points: LonLat[];
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

/** Même déroulage de l'antiméridien que le rendu du globe (src/render/globe.ts). */
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

function closeOverPole(ring: LonLat[]): LonLat[] {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last || Math.abs(first[0] - last[0]) < 180) return ring;
  let sum = 0;
  for (const p of ring) sum += p[1];
  const pole = sum < 0 ? -90 : 90;
  return [...ring, [last[0], pole], [first[0], pole]];
}

function makeRing(raw: LonLat[]): Ring {
  const points = closeOverPole(unwrap(raw.slice(0, -1)));
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of points) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { points, minLon, maxLon, minLat, maxLat };
}

function inRing(ring: Ring, lon: number, lat: number): boolean {
  if (lon < ring.minLon || lon > ring.maxLon || lat < ring.minLat || lat > ring.maxLat) return false;
  const pts = ring.points;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]!;
    const b = pts[j]!;
    if (a[1] > lat !== b[1] > lat && lon < ((b[0] - a[0]) * (lat - a[1])) / (b[1] - a[1]) + a[0]) {
      inside = !inside;
    }
  }
  return inside;
}

const atlas = JSON.parse(
  readFileSync(new URL('../node_modules/world-atlas/countries-110m.json', import.meta.url), 'utf8'),
);
const collection = feature(atlas, atlas.objects.countries) as unknown as {
  features: { geometry: { type: string; coordinates: unknown }; properties: { name: string } }[];
};

// Même ordre et même filtrage que src/world.ts : l'indice du pays doit correspondre.
const countries: { name: string; polygons: Ring[][] }[] = [];
for (const f of collection.features) {
  const g = f.geometry;
  let polys: LonLat[][][];
  if (g.type === 'Polygon') polys = [g.coordinates as LonLat[][]];
  else if (g.type === 'MultiPolygon') polys = g.coordinates as LonLat[][][];
  else continue;
  countries.push({ name: f.properties.name, polygons: polys.map((p) => p.map(makeRing)) });
}
if (countries.length >= SEA) throw new Error('Trop de pays pour un octet par case.');

const cells = 6 * N * N;
const grid = new Uint8Array(cells).fill(SEA);
const dir = [0, 0, 0];

function countryAt(lon: number, lat: number): number {
  for (let c = 0; c < countries.length; c++) {
    for (const polygon of countries[c]!.polygons) {
      // Les anneaux déroulés peuvent dépasser ±180° : on teste aussi les longitudes décalées.
      for (const shift of [0, 360, -360]) {
        const outer = polygon[0]!;
        if (!inRing(outer, lon + shift, lat)) continue;
        let inHole = false;
        for (let h = 1; h < polygon.length; h++) {
          if (inRing(polygon[h]!, lon + shift, lat)) inHole = true;
        }
        if (!inHole) return c;
      }
    }
  }
  return SEA;
}

// 1) Chaque case prend le pays qui contient son centre.
for (let cell = 0; cell < cells; cell++) {
  cellToDir(N, cell, dir);
  const lat = Math.asin(dir[1]!) * RAD;
  const lon = Math.atan2(dir[0]!, dir[2]!) * RAD;
  grid[cell] = countryAt(lon, lat);
}

// 2) Chaque sommet de contour marque sa case : les petites îles et les côtes fines existent.
const DEG = Math.PI / 180;
countries.forEach((country, c) => {
  for (const polygon of country.polygons) {
    for (const [lon, lat] of polygon[0]!.points) {
      if (Math.abs(lat) >= 90) continue;
      const cos = Math.cos(lat * DEG);
      const cell = dirToCell(N, cos * Math.sin(lon * DEG), Math.sin(lat * DEG), cos * Math.cos(lon * DEG));
      if (grid[cell] === SEA) grid[cell] = c;
    }
  }
});

// 3) Les terres débordent d'une case sur la mer : aucune frange non capturable le long des côtes.
const dilated = grid.slice();
for (let cell = 0; cell < cells; cell++) {
  if (grid[cell] !== SEA) continue;
  for (let k = 0; k < 4; k++) {
    const other = grid[neighbor(N, cell, k)]!;
    if (other !== SEA) {
      dilated[cell] = other;
      break;
    }
  }
}

const counts = new Array<number>(countries.length).fill(0);
let land = 0;
for (const c of dilated) {
  if (c === SEA) continue;
  counts[c]!++;
  land++;
}
const empty = countries.filter((_, i) => counts[i] === 0).map((c) => c.name);
const smallest = countries
  .map((c, i) => ({ name: c.name, cells: counts[i]! }))
  .sort((a, b) => a.cells - b.cells)
  .slice(0, 5);

const out = new Uint8Array(2 + cells);
out[0] = N & 0xff;
out[1] = N >> 8;
out.set(dilated, 2);
mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/world-grid.bin', import.meta.url), out);

console.log(`Grille ${N} : ${cells} cases, ${((land / cells) * 100).toFixed(1)} % de terre.`);
console.log(`Pays sans case : ${empty.length ? empty.join(', ') : 'aucun'}.`);
console.log('Plus petits pays :', smallest.map((s) => `${s.name} (${s.cells})`).join(', '));
