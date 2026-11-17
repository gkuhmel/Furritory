// Écran de fin de partie.
import { S } from '../save';
import { G, type DeathCause } from '../state';
import { $ } from '../util';
import { missionsHTML, mult } from '../meta/missions';
import { replay, showScreen } from './screens';
import { openMap } from './map';
import { THEMES } from '../world/themes';
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
  if (G.state !== 'over') return; // une autre partie a déjà commencé
  $('oTitle').textContent = (G.deathCause && CAUSES[G.deathCause]) || 'Aïe !';
  const lvl = G.mode === 'level';
  $('oScore').textContent = lvl ? Math.round(100 * Math.min(1, G.passed / G.def!.pairs)) + ' %' : String(G.score);
  $('oBest').textContent = lvl ? `${THEMES[G.world].name} · niveau ${G.level + 1} — essaie encore !` : 'Record : ' + S.best;
  $('bMenu').textContent = lvl ? '🗺️ Carte' : 'Menu';
  $('oNew').classList.toggle('hidden', !G.newBest);
  $('oBao').innerHTML = `🥟 +${earned}` + (mult() > 1 ? ` <small>(×${mult()})</small>` : '');
  $('oWallet').textContent = String(S.bao); $('oMissions').innerHTML = missionsHTML();
  showScreen('over');
}

export function initGameOver(): void {
  $('bAgain').onclick = replay;
  $('bShop2').onclick = () => openShop('over');
  $('bMenu').onclick = () => (G.mode === 'level' ? openMap() : showMenu());
}
