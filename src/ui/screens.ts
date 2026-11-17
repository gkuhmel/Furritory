// Bascule entre les écrans HTML posés sur le canvas.
import { startLevel, startRun } from '../game';
import { $ } from '../util';
import { G } from '../state';

export type ScreenId = 'menu' | 'over' | 'shop' | 'map' | 'win';
const IDS: ScreenId[] = ['menu', 'over', 'shop', 'map', 'win'];

export function showScreen(id: ScreenId | null): void {
  for (const s of IDS) $(s).classList.toggle('hidden', s !== id);
}

export const isShown = (id: ScreenId): boolean => !$(id).classList.contains('hidden');

// Lance une partie et masque les écrans.
export function play(): void {
  startRun();
  showScreen(null);
}

// Lance un niveau de l'aventure.
export function playLevel(w: number, l: number): void {
  startLevel(w, l);
  showScreen(null);
}

// Rejoue ce qu'on vient de jouer (niveau ou mode infini).
export function replay(): void {
  if (G.mode === 'level') playLevel(G.world, G.level); else play();
}
