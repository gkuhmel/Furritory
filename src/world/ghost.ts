// Fantôme du record : enregistrement de la trajectoire et dépassement.
import { GHOST_STEP } from '../config';
import { S } from '../save';
import { G } from '../state';
import { banner } from './fx';

export function recordGhost(): void {
  while (G.ghostRec.length * GHOST_STEP < G.distTot) G.ghostRec.push(Math.round(G.panda.y));
}

export function checkGhost(): void {
  if (S.ghost && !G.ghostDone && Math.floor(G.distTot / GHOST_STEP) >= S.ghost.length) {
    G.ghostDone = true; banner('👻 Ton record était ici !', '#e0d0ff', 22);
  }
}

// Hauteur du fantôme à la distance courante (null s'il n'y en a pas).
export function ghostY(): number | null {
  if (G.state !== 'play' || G.mode !== 'endless' || !S.ghost || G.ghostDone) return null;
  return S.ghost[Math.floor(G.distTot / GHOST_STEP)] ?? null;
}
