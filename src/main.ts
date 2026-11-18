// Démarrage, redimensionnement et boucle principale.
import * as C from './config';
import { view } from './state';
import { update } from './game';
import { cv, ctx } from './render/canvas';
import { render } from './render/frame';
import { buildScenery } from './world/scenery';
import { deathHooks } from './world/damage';
import { refreshMissions } from './meta/missions';
import { startMusic } from './audio/music';
import { initInput } from './input';
import { fitMenuPanda, initMenu, showMenu } from './ui/menu';
import { initGameOver, showOver } from './ui/gameover';
import { drawPreview, initShop, updatePreview } from './ui/shop';
import { isShown } from './ui/screens';
import { drawMapChoco, initMap } from './ui/map';
import { initWin, showWin } from './ui/win';
import { winHooks } from './world/level';

function resize(): void {
  view.dpr = Math.min(window.devicePixelRatio || 1, C.DPR_MAX);
  const cw = innerWidth, ch = innerHeight;
  // monde de H px de haut, largeur adaptée au ratio de l'écran
  view.W = Math.max(C.W_MIN, Math.min(C.W_MAX, cw * C.H / ch));
  cv.width = Math.round(cw * view.dpr); cv.height = Math.round(ch * view.dpr);
  ctx.setTransform(view.dpr * cw / view.W, 0, 0, view.dpr * ch / C.H, 0, 0);
  buildScenery();
}

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(C.DT_MAX, (now - last) / 1000); last = now;
  update(dt);
  render();
  if (isShown('shop')) { updatePreview(dt); drawPreview(); }
  if (isShown('map')) drawMapChoco();
  requestAnimationFrame(frame);
}

addEventListener('resize', resize);
deathHooks.onOver = showOver;
winHooks.onWin = showWin;
initInput(); initMenu(); initGameOver(); initShop(); initMap(); initWin();
startMusic();
resize(); refreshMissions(); showMenu();
requestAnimationFrame(frame);
// les polices arrivent après le premier affichage : on recale Choco au menu
document.fonts?.ready.then(fitMenuPanda).catch(() => {});
