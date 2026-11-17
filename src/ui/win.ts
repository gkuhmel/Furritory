// Écran de victoire d'un niveau : étoiles, lettres CHOCO, bao gagnés.
import * as C from '../config';
import { S } from '../save';
import { G } from '../state';
import { $ } from '../util';
import { missionsHTML, mult } from '../meta/missions';
import { THEMES } from '../world/themes';
import { playLevel, replay, showScreen } from './screens';
import { openMap } from './map';

export function showWin(stars: number, earned: number): void {
  if (G.state !== 'win') return;
  $('wLevel').textContent = `Monde ${G.world + 1} · ${THEMES[G.world].name} · niveau ${G.level + 1}`;
  $('wStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}" style="animation-delay:${0.15 + i * 0.25}s">⭐</span>`).join('');
  $('wLetters').innerHTML = C.LETTERS.map((L, i) => `<b class="${G.letters[i] ? 'on' : ''}">${L}</b>`).join('');
  const choco = G.letters.every(Boolean);
  $('wBao').innerHTML = `🥟 +${earned}` + (mult() > 1 || choco ? ` <small>(${mult() > 1 ? '×' + mult() : ''}${choco ? ' ×' + C.CHOCO_BAO_MULT + ' CHOCO' : ''})</small>` : '');
  $('wWallet').textContent = String(S.bao); $('wMissions').innerHTML = missionsHTML();
  const last = G.world === C.WORLDS - 1 && G.level === C.LEVELS_PER_WORLD - 1;
  $('bNext').textContent = last ? '🗺️ Carte' : G.level === C.LEVELS_PER_WORLD - 1 ? `Monde ${G.world + 2} !` : 'Niveau suivant';
  showScreen('win');
}

export function initWin(): void {
  $('bNext').onclick = () => {
    const n = G.world * C.LEVELS_PER_WORLD + G.level + 1;
    if (n >= C.WORLDS * C.LEVELS_PER_WORLD) { openMap(); return; }
    playLevel(Math.floor(n / C.LEVELS_PER_WORLD), n % C.LEVELS_PER_WORLD);
  };
  $('bWinAgain').onclick = replay;
  $('bWinMap').onclick = openMap;
}
