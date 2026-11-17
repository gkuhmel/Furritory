// Cascades : colonnes d'eau qui poussent vers le bas, pas mortelles.
import * as C from '../config';
import { G } from '../state';
import { rnd } from '../util';

export function spawnCascade(ix: number): void {
  G.cascades.push({ x: ix - C.CASCADE_W / 2, w: C.CASCADE_W });
}

export function updateCascades(move: number, tdt: number): void {
  const { panda } = G;
  for (const c of G.cascades) {
    c.x -= move;
    if (G.dragonT <= 0 && G.dashT <= 0 && Math.abs(panda.x - (c.x + c.w / 2)) < c.w / 2 + 10) {
      panda.vy += C.CASCADE_PUSH * tdt;
      if (Math.random() < 0.4) G.parts.push({ x: panda.x, y: panda.y - 10, vx: rnd(-60, 60), vy: rnd(-60, 0), l: 0.4, ml: 0.4, c: '#bfe8ff', r: rnd(2, 3), g: 1 });
    }
  }
  G.cascades = G.cascades.filter(c => c.x > -60);
}
