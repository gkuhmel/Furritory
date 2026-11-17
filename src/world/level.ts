// Aventure : lancement d'un niveau, arrivée, étoiles et déblocage.
import * as C from '../config';
import { S, saveS } from '../save';
import { G, view } from '../state';
import { sfx } from '../audio/sfx';
import { mult } from '../meta/missions';
import { THEMES } from './themes';
import { banner, burst } from './fx';

export const levelIndex = (w: number, l: number): number => w * C.LEVELS_PER_WORLD + l;
export const starsOf = (w: number, l: number): number => S.levels[levelIndex(w, l)] || 0;
export const totalStars = (): number => S.levels.reduce((a, b) => a + (b || 0), 0);

// Premier niveau pas encore réussi (les niveaux se débloquent dans l'ordre).
export function currentLevel(): number {
  const n = C.WORLDS * C.LEVELS_PER_WORLD;
  for (let i = 0; i < n; i++) if (!S.levels[i]) return i;
  return n - 1;
}
export const isUnlocked = (i: number): boolean => i <= currentLevel() || !!S.levels[i];

export const theme = () => THEMES[G.mode === 'level' ? G.world : 0];

export function countStars(): number {
  const n = G.letters.filter(Boolean).length;
  return n >= C.LETTERS.length ? 3 : n >= C.STARS_2_LETTERS ? 2 : 1;
}

// Branché par l'interface : affichage de l'écran de victoire.
export const winHooks = { onWin: (_stars: number, _earned: number): void => {} };

export function winLevel(): void {
  if (G.state !== 'play') return;
  G.state = 'win'; G.overT = G.t;
  const stars = countStars(); G.stars = stars;
  const i = levelIndex(G.world, G.level);
  S.levels[i] = Math.max(S.levels[i] || 0, stars);
  const choco = G.letters.every(Boolean);
  const earned = Math.round(G.coins * mult() * (choco ? C.CHOCO_BAO_MULT : 1));
  S.bao += earned; saveS();
  sfx.power(); setTimeout(() => sfx.gong(), 200);
  banner('🎉 Arrivée !', '#ffcf4a', 36);
  for (let k = 0; k < 6; k++) burst(view.W * (0.2 + k * 0.12), 120 + (k % 2) * 60, ['#ffcf4a', '#ff7a45', '#7df9ff', '#ffb3c8'][k % 4], 18, 260);
  setTimeout(() => winHooks.onWin(stars, earned), C.WIN_DELAY_MS);
}

// Arche d'arrivée : défile et déclenche la victoire quand le panda la franchit.
export function updateFinish(move: number): void {
  const f = G.finish;
  if (!f) return;
  f.x -= move;
  if (!f.passed && f.x < G.panda.x) { f.passed = true; winLevel(); }
}

// Après la victoire : le panda s'envole vers la droite.
export function flyAway(dt: number): void {
  const p = G.panda;
  p.x += 220 * dt; p.vy += (-120 - p.vy) * 2 * dt; p.y += p.vy * dt; p.rot = -0.25; p.wing = (Math.sin(G.t * 14) + 1) / 2;
  if (G.finish) G.finish.x -= G.speed * 0.4 * dt;
}
