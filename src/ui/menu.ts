// Écran d'accueil.
import { S, saveS } from '../save';
import { G, reset } from '../state';
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
}

export function initMenu(): void {
  $('bPlay').onclick = openMap;
  $('bEndless').onclick = play;
  $('bShop').onclick = () => openShop('menu');
  $('bSound').onclick = () => {
    S.sound = !S.sound; saveS(); applySound();
    $('bSound').textContent = S.sound ? '🔊' : '🔇';
  };
}
