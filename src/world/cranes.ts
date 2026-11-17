// Grues : volent vers le panda en ondulant, mortelles.
import * as C from '../config';
import { G } from '../state';
import { clamp, rnd } from '../util';
import { burst } from './fx';
import { collide } from './damage';

export function spawnCrane(ix: number, cy: number): void {
  const side = Math.random() < 0.5 ? -1 : 1;
  G.cranes.push({ x: ix, y0: clamp(cy + side * rnd(75, 110), 60, C.GROUND - 60), y: 0, ph: rnd(0, 6), amp: rnd(15, 35) });
}

export function updateCranes(move: number, tdt: number): boolean {
  const { panda } = G;
  for (const c of G.cranes) {
    c.x -= move + C.CRANE_SPEED * tdt; c.ph += tdt * 2; c.y = c.y0 + Math.sin(c.ph) * c.amp;
    if (!c.dead && Math.hypot(panda.x - c.x, panda.y - c.y) < C.CRANE_HIT) {
      const r = collide('grue'); if (r === 'dead') return true;
      c.dead = true; burst(c.x, c.y, '#ffffff', 14, 200); if (r === 'smash') G.stats.smash++;
    }
  }
  G.cranes = G.cranes.filter(c => !c.dead && c.x > -60);
  return false;
}
