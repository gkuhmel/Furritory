// Dragon céleste : 12 bao le déclenchent, il porte le panda quelques secondes.
import * as C from '../config';
import { G, view } from '../state';
import { rnd } from '../util';
import { sfx } from '../audio/sfx';
import { banner } from './fx';

export function startDragon(): void {
  G.dragonT = C.DRAGON_TIME; G.gauge = 0; G.stats.dragon++; sfx.gong(); banner('🐉 Dragon céleste !', '#ffcf4a', 34); G.flash = 0.6;
}

export function updateDragonTimer(dt: number): void {
  if (G.dragonT > 0) {
    G.dragonT -= dt;
    if (G.dragonT <= 0) { G.ghostT = C.DRAGON_END_GHOST; banner('Le dragon s’envole…', '#fff', 20); }
  }
}

// Le corps du dragon suit la trajectoire récente du panda.
export function recordDragonTrail(): void {
  G.dragonHist.unshift(G.panda.y); if (G.dragonHist.length > 80) G.dragonHist.pop();
}

// Pluie de bao pendant le vol.
export function updateDragonRain(dt: number): void {
  if (G.dragonT > 0) {
    G.rainT -= dt;
    if (G.rainT <= 0) { G.rainT = C.DRAGON_RAIN_INTERVAL; G.items.push({ type: 'bao', x: view.W + 20, y: rnd(80, C.GROUND - 80), r: 13, ph: rnd(0, 6) }); }
  }
}
