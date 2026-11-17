// Décor : génération et animation (montagnes, forêt lointaine, particules d'ambiance, lanternes).
import { GROUND, H } from '../config';
import { G, view } from '../state';
import { rnd } from '../util';
import { SEASONS, type AmbKind } from './seasons';

export interface Mountain { x: number; w: number; h: number }
export interface FarBamboo { x: number; w: number; h: number; c: number }
export interface Amb { k: AmbKind; x: number; y: number; a: number; va: number; ph: number; vx: number; vy: number; r: number; c: string }
export interface Lantern { x: number; y: number; s: number; ph: number }

export const scenery = {
  mountains: [] as Mountain[][],
  farBamboo: [] as FarBamboo[],
  amb: [] as Amb[],
  lanterns: [] as Lantern[],
};

// Regénère le décor à la nouvelle largeur.
export function buildScenery(): void {
  const W = view.W;
  scenery.mountains = [];
  for (let li = 0; li < 3; li++) {
    const pts: Mountain[] = []; let x = -60;
    while (x < W + 400) { const w = rnd(70, 150); pts.push({ x, w, h: rnd(120, 260) - li * 50 }); x += w * rnd(0.5, 0.8); }
    scenery.mountains.push(pts);
  }
  scenery.farBamboo = [];
  for (let x = 0; x < W + 200; x += rnd(18, 40)) scenery.farBamboo.push({ x, w: rnd(5, 9), h: rnd(200, 420), c: Math.random() });
  if (!scenery.amb.length) for (let i = 0; i < 45; i++) scenery.amb.push(newAmb(true));
  if (!scenery.lanterns.length) for (let i = 0; i < 6; i++) scenery.lanterns.push({ x: rnd(0, W), y: rnd(60, 340), s: rnd(0.6, 1), ph: rnd(0, 6) });
}

function newAmb(any: boolean): Amb {
  const k = SEASONS[G.curSeason].p;
  const a: Amb = { k, x: any ? rnd(0, view.W) : view.W + 10, y: rnd(-20, H * 0.75), a: rnd(0, 6), va: rnd(-3, 3), ph: rnd(0, 6), vx: 0, vy: 0, r: 0, c: '' };
  if (k === 'petal') Object.assign(a, { vx: rnd(-60, -20), vy: rnd(10, 40), r: rnd(2, 4.5), c: Math.random() < 0.7 ? '#ffb3c8' : '#ffd27a' });
  if (k === 'firefly') Object.assign(a, { vx: rnd(-30, -8), vy: 0, r: rnd(1.5, 2.8), y: rnd(GROUND - 320, GROUND - 20), c: '#fff59a' });
  if (k === 'maple') Object.assign(a, { vx: rnd(-70, -30), vy: rnd(20, 50), r: rnd(4, 6.5), c: ['#e8343a', '#ff7a2a', '#ffb02a'][Math.floor(rnd(0, 3))] });
  if (k === 'sparkle') Object.assign(a, { vx: rnd(-30, -10), vy: rnd(8, 25), r: rnd(1.5, 3), c: Math.random() < 0.6 ? '#fff6c0' : '#ffffff' });
  if (k === 'snow') Object.assign(a, { vx: rnd(-40, -10), vy: rnd(30, 70), r: rnd(1.5, 3.5), c: '#ffffff' });
  return a;
}

export function updateScenery(dt: number, scroll: number): void {
  const t = G.t;
  for (const p of scenery.amb) {
    p.x += p.vx * dt - scroll * 0.25 * dt; p.a += p.va * dt;
    if (p.k === 'firefly') p.y += Math.sin(t * 1.5 + p.ph) * 0.4; else p.y += p.vy * dt;
    if (p.x < -12 || p.y > H + 12) Object.assign(p, newAmb(false));
  }
  for (const l of scenery.lanterns) {
    l.x -= (G.state === 'play' ? G.speed * 0.15 : 12) * dt; l.y += Math.sin(t + l.ph) * 0.15;
    if (l.x < -30) { l.x = view.W + 30; l.y = rnd(60, 340); }
  }
}

// Renouvelle les particules d'ambiance (changement de monde).
export function resetAmb(): void {
  scenery.amb = [];
  for (let i = 0; i < 45; i++) scenery.amb.push(newAmb(true));
}
