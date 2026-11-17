// Événements au hasard : vent, fête des lanternes, brume.
import * as C from '../config';
import { G, type EventKind } from '../state';
import { rnd } from '../util';
import { banner } from './fx';

export function updateEvents(dt: number): void {
  if (G.evt) { G.evt.t -= dt; if (G.evt.t <= 0) G.evt = null; return; }
  if (G.boss || G.dragonT > 0 || G.score < C.EVENT_MIN_SCORE) return;
  G.evtT -= dt;
  if (G.evtT > 0) return;
  const k: EventKind = (['wind', 'festival', 'fog'] as const)[Math.floor(rnd(0, 3))];
  const evt = { k, t: C.EVENT_TIME, dir: Math.random() < 0.5 ? -1 : 1 };
  G.evt = evt; G.evtT = rnd(C.EVENT_GAP_MIN, C.EVENT_GAP_MAX);
  if (k === 'wind') banner(evt.dir < 0 ? '🌬️ Vent ascendant !' : '🌬️ Rafale plongeante !', '#e8f6ff', 26);
  if (k === 'festival') banner('🏮 Fête des lanternes !', '#ffcf4a', 28);
  if (k === 'fog') banner('🌫️ Brume de montagne…', '#ffffff', 26);
}
