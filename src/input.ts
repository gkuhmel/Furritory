// Entrées : toucher / clic sur le canvas, espace ou flèche haut.
import { RESTART_KEY_DELAY } from './config';
import { G } from './state';
import { initAudio } from './audio/sfx';
import { flap } from './world/panda';
import { cv } from './render/canvas';
import { play, replay } from './ui/screens';

export function initInput(): void {
  // l'audio ne peut démarrer que sur un geste de l'utilisateur (Safari iOS)
  document.addEventListener('pointerdown', initAudio, true);
  cv.addEventListener('pointerdown', e => { e.preventDefault(); flap(); }, { passive: false });
  addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault(); initAudio();
      if (G.state === 'play') flap();
      else if (G.state === 'menu') play();
      else if (G.state === 'over' && G.t - G.overT > RESTART_KEY_DELAY) replay();
    }
  });
}
