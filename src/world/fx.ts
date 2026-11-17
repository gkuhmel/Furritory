// Effets logiques : textes flottants, bannières, particules, traînées.
import { G, type Particle } from '../state';
import { rnd } from '../util';

export function pop(x: number, y: number, txt: string, col = '#fff', size = 22): void {
  G.pops.push({ x, y, txt, col, size, l: 1 });
}

export function banner(txt: string, col = '#fff', size = 28): void {
  G.banners.push({ txt, col, size, l: 2.2 });
}

export function burst(x: number, y: number, col: string, n = 14, sp = 220, g = 1): void {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.28), s = rnd(40, sp);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: rnd(0.4, 0.8), ml: 0.8, c: col, r: rnd(2, 4.5), g });
  }
}

export function spawnTrail(arr: Particle[], x: number, y: number, type: string): void {
  if (type === 'petals') arr.push({ x, y: y + rnd(-5, 5), vx: rnd(-160, -100), vy: rnd(-10, 30), l: 0.9, ml: 0.9, c: Math.random() < 0.6 ? '#ffb3c8' : '#fff', r: rnd(2, 3.5), g: 0.1, sh: 'e' });
  if (type === 'sparks') arr.push({ x, y: y + rnd(-4, 4), vx: rnd(-260, -160), vy: rnd(-40, 40), l: 0.45, ml: 0.45, c: Math.random() < 0.5 ? '#ffcf4a' : '#fff6c0', r: rnd(1.2, 2.4), g: 0 });
  if (type === 'ink') arr.push({ x, y: y + rnd(-3, 3), vx: -170, vy: rnd(-8, 8), l: 0.8, ml: 0.8, c: '#2a1a3a', r: rnd(3, 6), g: 0, a: 0.45 });
  if (type === 'rainbow') arr.push({ x, y: y + rnd(-3, 3), vx: -170, vy: 0, l: 0.55, ml: 0.55, c: `hsl(${(G.t * 300) % 360},95%,62%)`, r: rnd(3, 5), g: 0 });
}

// Vieillissement des effets (temps réel, hors facteur de ralenti).
export function updateFx(dt: number): void {
  if (G.shake > 0) G.shake -= dt;
  if (G.flash > 0) G.flash -= dt * 2.5;
  for (const p of G.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * (p.g ?? 1) * dt; p.l -= dt; }
  G.parts = G.parts.filter(p => p.l > 0);
  for (const p of G.pops) { p.y -= 40 * dt; p.l -= dt * 1.1; }
  G.pops = G.pops.filter(p => p.l > 0);
  for (const b of G.banners) b.l -= dt;
  G.banners = G.banners.filter(b => b.l > 0);
}
