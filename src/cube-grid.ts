/**
 * Grille de territoire : la sphère est découpée en 6 faces de cube de n × n cases.
 * Les cases sont réparties à angle égal sur chaque face, donc de taille presque uniforme.
 *
 * Faces : 0 = +X, 1 = −X, 2 = +Y, 3 = −Y, 4 = +Z, 5 = −Z.
 * Coordonnées (u, v) d'une face : X → (y, z), Y → (z, x), Z → (x, y).
 * Indice d'une case : face · n² + j · n + i, avec i le long de u et j le long de v.
 *
 * Ce fichier est partagé par le jeu et par le script de build (`scripts/build-grid.ts`) :
 * il ne doit rien importer. Le shader des zones reproduit la même convention.
 */

const QUARTER_PI = Math.PI / 4;

/** Case contenant la direction (x, y, z). */
export function dirToCell(n: number, x: number, y: number, z: number): number {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const az = Math.abs(z);
  let face: number;
  let u: number;
  let v: number;
  if (ax >= ay && ax >= az) {
    face = x > 0 ? 0 : 1;
    u = y / ax;
    v = z / ax;
  } else if (ay >= az) {
    face = y > 0 ? 2 : 3;
    u = z / ay;
    v = x / ay;
  } else {
    face = z > 0 ? 4 : 5;
    u = x / az;
    v = y / az;
  }
  const i = Math.min(n - 1, Math.max(0, Math.floor((Math.atan(u) / QUARTER_PI + 1) * 0.5 * n)));
  const j = Math.min(n - 1, Math.max(0, Math.floor((Math.atan(v) / QUARTER_PI + 1) * 0.5 * n)));
  return face * n * n + j * n + i;
}

/** Direction (non normalisée) du point de paramètres (a, b) ∈ [−1, 1]² d'une face. */
function faceDir(face: number, a: number, b: number, out: number[]): void {
  const u = Math.tan(a * QUARTER_PI);
  const v = Math.tan(b * QUARTER_PI);
  switch (face) {
    case 0:
      out[0] = 1; out[1] = u; out[2] = v;
      break;
    case 1:
      out[0] = -1; out[1] = u; out[2] = v;
      break;
    case 2:
      out[0] = v; out[1] = 1; out[2] = u;
      break;
    case 3:
      out[0] = v; out[1] = -1; out[2] = u;
      break;
    case 4:
      out[0] = u; out[1] = v; out[2] = 1;
      break;
    default:
      out[0] = u; out[1] = v; out[2] = -1;
  }
}

/** Direction unitaire du centre d'une case. */
export function cellToDir(n: number, cell: number, out: number[]): void {
  const nn = n * n;
  const face = Math.floor(cell / nn);
  const rest = cell - face * nn;
  const j = Math.floor(rest / n);
  const i = rest - j * n;
  faceDir(face, ((i + 0.5) / n) * 2 - 1, ((j + 0.5) / n) * 2 - 1, out);
  const inv = 1 / Math.hypot(out[0] ?? 0, out[1] ?? 0, out[2] ?? 0);
  out[0] = (out[0] ?? 0) * inv;
  out[1] = (out[1] ?? 0) * inv;
  out[2] = (out[2] ?? 0) * inv;
}

const tmp = [0, 0, 0];

/** Voisine d'une case dans la direction k : 0 = −i, 1 = +i, 2 = −j, 3 = +j. Gère les bords de face. */
export function neighbor(n: number, cell: number, k: number): number {
  const nn = n * n;
  const face = Math.floor(cell / nn);
  const rest = cell - face * nn;
  const j = Math.floor(rest / n);
  const i = rest - j * n;
  const ni = k === 0 ? i - 1 : k === 1 ? i + 1 : i;
  const nj = k === 2 ? j - 1 : k === 3 ? j + 1 : j;
  if (ni >= 0 && ni < n && nj >= 0 && nj < n) return face * nn + nj * n + ni;
  // Hors de la face : on sort géométriquement, la direction tombe sur la face voisine.
  faceDir(face, ((ni + 0.5) / n) * 2 - 1, ((nj + 0.5) / n) * 2 - 1, tmp);
  return dirToCell(n, tmp[0] ?? 0, tmp[1] ?? 0, tmp[2] ?? 0);
}
