// Ponts de corde : planches suspendues, mortelles.
import * as C from '../config';
import { G } from '../state';
import { clamp, rnd } from '../util';
import { burst } from './fx';
import { collide } from './damage';

export function spawnBridge(ix: number, cy: number): void {
  const below = Math.random() < 0.5;
  const by = clamp(cy + (below ? 1 : -1) * rnd(95, 120), 80, C.GROUND - 80);
  G.bridges.push({ x: ix - C.BRIDGE_LEN / 2, y: by, len: C.BRIDGE_LEN, fall: 0, broken: false });
  // la paire suivante est forcée du même côté pour rester franchissable
  G.forceSide = { y: by, above: by > cy };
}

export function updateBridges(move: number, dt: number): boolean {
  const { panda } = G;
  for (const b of G.bridges) {
    b.x -= move; if (b.broken) { b.fall += 400 * dt; continue; }
    if (panda.x > b.x - 6 && panda.x < b.x + b.len + 6) {
      const u = clamp((panda.x - b.x) / b.len, 0, 1), yy = b.y + Math.sin(Math.PI * u) * 14;
      if (Math.abs(panda.y - yy) < C.BRIDGE_HIT) {
        const r = collide('pont'); if (r === 'dead') return true;
        if (r === 'smash') { b.broken = true; G.stats.smash++; burst(panda.x, yy, '#b07a3a', 14, 200); }
      }
    }
  }
  G.bridges = G.bridges.filter(b => b.x > -140 && b.fall < 700);
  return false;
}
