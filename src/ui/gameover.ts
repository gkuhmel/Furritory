// Écran de fin de partie.
import { S } from '../save';
import { G, type DeathCause } from '../state';
import { $ } from '../util';
import { missionsHTML, mult } from '../meta/missions';
import { play, showScreen } from './screens';
import { openShop } from './shop';
import { showMenu } from './menu';

const CAUSES: Record<DeathCause, string> = {
  bambou: 'Aïe, le bambou !',
  sol: 'Plouf dans la rivière !',
  grue: 'Percuté par une grue !',
  pomme: 'Pomme de pin en pleine tête !',
  pont: 'Coincé dans le pont !',
};

export function showOver(earned: number): void {
  $('oTitle').textContent = (G.deathCause && CAUSES[G.deathCause]) || 'Aïe !';
  $('oScore').textContent = String(G.score); $('oBest').textContent = 'Record : ' + S.best;
  $('oNew').classList.toggle('hidden', !G.newBest);
  $('oBao').innerHTML = `🥟 +${earned}` + (mult() > 1 ? ` <small>(×${mult()})</small>` : '');
  $('oWallet').textContent = String(S.bao); $('oMissions').innerHTML = missionsHTML();
  showScreen('over');
}

export function initGameOver(): void {
  $('bAgain').onclick = play;
  $('bShop2').onclick = () => openShop('over');
  $('bMenu').onclick = showMenu;
}
