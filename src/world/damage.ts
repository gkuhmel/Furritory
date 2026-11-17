// Chocs, bouclier et mort.
import * as C from '../config';
import { S, saveS } from '../save';
import { G, inv, type DeathCause } from '../state';
import { sfx } from '../audio/sfx';
import { mult } from '../meta/missions';
import { burst, pop } from './fx';

// Appelé après la chute du panda ; branché par l'interface.
export const deathHooks = { onOver: (_earned: number): void => {} };

export function die(cause: DeathCause): void {
  const { panda } = G;
  if (!panda.alive) return;
  panda.alive = false; G.state = 'over'; G.overT = G.t; G.shake = 0.5; G.flash = 1; sfx.hit(); G.deathCause = cause;
  burst(panda.x, panda.y, '#ff7a3d', 24, 300);
  G.newBest = G.mode === 'endless' && G.score > S.best;
  if (G.newBest) { S.best = G.score; S.ghost = G.ghostRec.slice(0, C.GHOST_MAX); }
  const earned = Math.round(G.coins * mult()); S.bao += earned; saveS();
  setTimeout(() => deathHooks.onOver(earned), C.OVER_DELAY_MS);
}

export function hitShield(): void {
  const { panda } = G;
  G.shield = false; G.ghostT = C.SHIELD_GHOST_TIME; G.shake = 0.25; sfx.shield(); burst(panda.x, panda.y, '#ffcf4a', 20, 260);
  G.stats.shieldBreak++; pop(panda.x, panda.y - 30, 'Bouclier brisé !', '#ffcf4a', 20);
}

export type HitResult = 'smash' | 'pass' | 'dead';

// Gère une collision : « smash » si l'obstacle doit être cassé.
export function collide(cause: DeathCause): HitResult {
  if (inv()) return 'smash';
  if (G.ghostT > 0) return 'pass';
  if (G.shield) { hitShield(); return 'pass'; }
  die(cause); return 'dead';
}
