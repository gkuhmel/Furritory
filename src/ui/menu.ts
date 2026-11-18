// Écran d'accueil.
import { S, saveS } from '../save';
import { G, reset, view } from '../state';
import * as C from '../config';
import { $ } from '../util';
import { applySound } from '../audio/sfx';
import { missionsHTML, mult, refreshMissions } from '../meta/missions';
import { play, showScreen } from './screens';
import { openShop } from './shop';
import { openMap } from './map';
import { totalStars } from '../world/level';

export function showMenu(): void {
  refreshMissions(); G.state = 'menu'; reset();
  $('mStars').textContent = String(totalStars()); $('mBest').textContent = String(S.best); $('mBao').textContent = String(S.bao); $('mMult').textContent = String(mult());
  $('mMissions').innerHTML = missionsHTML(); $('bSound').textContent = S.sound ? '🔊' : '🔇';
  showScreen('menu');
  fitMenuPanda();
}

// Place Choco au milieu de l'espace libre entre le logo et les boutons du menu.
export function fitMenuPanda(): void {
  const logo = document.querySelector('.logo'), bottom = document.querySelector('.menubottom');
  if (!logo || !bottom || $('menu').classList.contains('hidden')) return;
  const a = logo.getBoundingClientRect().bottom, b = bottom.getBoundingClientRect().top, h = innerHeight || 1;
  view.menuY = (a + b) / 2 / h;
  // hauteur libre en unités du monde ; Choco fait environ 70 unités de haut à l'échelle 1
  view.menuScale = Math.max(0.8, Math.min(C.MENU_PANDA_SCALE, ((b - a) / h) * C.H / 80));
}

export function initMenu(): void {
  addEventListener('resize', fitMenuPanda);
  $('bPlay').onclick = openMap;
  $('bEndless').onclick = play;
  $('bShop').onclick = () => openShop('menu');
  $('bSound').onclick = () => {
    S.sound = !S.sound; saveS(); applySound();
    $('bSound').textContent = S.sound ? '🔊' : '🔇';
  };
}
