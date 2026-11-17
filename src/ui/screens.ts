// Bascule entre les écrans HTML posés sur le canvas.
import { startRun } from '../game';
import { $ } from '../util';

export type ScreenId = 'menu' | 'over' | 'shop';
const IDS: ScreenId[] = ['menu', 'over', 'shop'];

export function showScreen(id: ScreenId | null): void {
  for (const s of IDS) $(s).classList.toggle('hidden', s !== id);
}

export const isShown = (id: ScreenId): boolean => !$(id).classList.contains('hidden');

// Lance une partie et masque les écrans.
export function play(): void {
  startRun();
  showScreen(null);
}
