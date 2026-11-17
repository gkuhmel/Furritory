// Bonus : apparition, aimant, ramassage.
import * as C from '../config';
import { G } from '../state';
import { rnd } from '../util';
import { sfx } from '../audio/sfx';
import { burst, pop } from './fx';
import { startDragon } from './dragon';

// Bonus d'une tranche : bao dans le trou (x = baoX), puis un bonus entre deux paires (x = ix).
export function spawnSlotItems(baoX: number, ix: number, cy: number, extra: boolean): void {
  const fest = G.evt && G.evt.k === 'festival';
  if (Math.random() < (fest ? 1 : C.BAO_CHANCE)) G.items.push({ type: 'bao', x: baoX, y: cy, r: 13, ph: rnd(0, 6) });
  if (extra) return;
  const q = Math.random(); const y = rnd(140, C.GROUND - 140);
  if (fest) {
    for (let i = -1; i <= 1; i++) G.items.push({ type: 'bao', x: ix + i * 28, y: cy + i * 10, r: 13, ph: rnd(0, 6) });
    if (q < 0.25) G.items.push({ type: 'lantern', x: ix, y: cy - 60, r: 16, ph: 0 });
  }
  else if (q < C.LANTERN_CHANCE) G.items.push({ type: 'lantern', x: ix, y, r: 16, ph: 0 });
  else if (q < C.CLOUD_CHANCE) G.items.push({ type: 'cloud', x: ix, y, r: 18, ph: 0 });
  else if (q < C.PEACH_CHANCE) G.items.push({ type: 'peach', x: ix, y, r: 15, ph: 0 });
}

export function updateItems(move: number, tdt: number, dt: number): void {
  const { panda } = G;
  for (const it of G.items) {
    if (it.thrown) { it.x += it.vx! * tdt; it.y += it.vy! * tdt; it.vy! += C.PROJECTILE_GRAVITY * tdt; } else it.x -= move;
    it.ph += dt * 3;
    if ((G.magnetT > 0 || G.dragonT > 0) && it.type === 'bao') {
      const dx = panda.x - it.x, dy = panda.y - it.y, d = Math.hypot(dx, dy);
      if (d < C.MAGNET_RADIUS) { it.x += dx / d * C.MAGNET_SPEED * dt; it.y += dy / d * C.MAGNET_SPEED * dt; }
    }
    if (!it.got && Math.hypot(panda.x - it.x, panda.y - it.y) < it.r + C.PICKUP_RADIUS) {
      it.got = true;
      if (it.type === 'bao') {
        G.coins++; G.stats.bao++; G.score += C.BAO_POINTS; sfx.bao(); burst(it.x, it.y, '#fff4d6', 8, 150); pop(it.x, it.y - 20, '+' + C.BAO_POINTS, '#fff4d6', 16);
        if (G.dragonT <= 0) { G.gauge++; if (G.gauge >= C.DRAGON_NEED) startDragon(); }
      }
      if (it.type === 'lantern') { G.shield = true; sfx.power(); burst(it.x, it.y, '#ff4a4a', 18); pop(it.x, it.y - 24, 'Bouclier lanterne', '#ffcf4a', 20); }
      if (it.type === 'cloud') { G.dashT = C.DASH_TIME; sfx.power(); burst(it.x, it.y, '#ffffff', 18); pop(it.x, it.y - 24, 'Nuage-éclair !', '#ffffff', 22); }
      if (it.type === 'peach') { G.slowmo = C.PEACH_SLOW_TIME; G.magnetT = C.MAGNET_TIME; G.stats.peach++; sfx.power(); burst(it.x, it.y, '#ff9ab0', 18); pop(it.x, it.y - 24, 'Pêche d’immortalité', '#ffb3c8', 20); }
    }
  }
  G.items = G.items.filter(i => !i.got && i.x > -40 && i.y < C.H + 40);
}
