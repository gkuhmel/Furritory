// Mise à jour d'une image de jeu (logique uniquement) et lancement de partie.
import * as C from './config';
import { G, reset, view } from './state';
import { lerpPal, updateSeason } from './world/seasons';
import { updateScenery } from './world/scenery';
import { updateFx } from './world/fx';
import { fallPanda, hoverPanda, updatePanda, updatePandaBounds } from './world/panda';
import { updateEvents } from './world/events';
import { recordDragonTrail, updateDragonRain, updateDragonTimer } from './world/dragon';
import { checkGhost, recordGhost } from './world/ghost';
import { updateCones, updateMonkey } from './world/monkey';
import { updatePipes } from './world/pipes';
import { updateCranes } from './world/cranes';
import { updateCascades } from './world/cascades';
import { updateBridges } from './world/bridges';
import { updateItems } from './world/items';
import { checkMissions, refreshMissions } from './meta/missions';

export function startRun(): void {
  refreshMissions(); reset(); G.state = 'play';
  G.panda.vy = C.START_VY;
}

export function update(dt: number): void {
  G.t += dt;
  if (G.nearSlow > 0) G.nearSlow -= dt;
  // facteur de temps : ralenti « au pixel » et ralenti de la pêche (physique et défilement)
  const tdt = dt * (G.nearSlow > 0 ? C.PIXEL_SLOW_FACTOR : 1) * (G.slowmo > 0 ? C.PEACH_SLOW_FACTOR : 1);
  lerpPal(Math.min(1, dt * C.SEASON_FADE));
  updateScenery(dt, G.state === 'play' ? G.speed : C.MENU_SCROLL);
  updateFx(dt);

  if (G.state === 'menu' || G.state === 'shop') { hoverPanda(dt, view.W); return; }
  if (G.state === 'over') { fallPanda(dt); return; }

  // minuteurs
  if (G.slowmo > 0) G.slowmo -= dt;
  if (G.magnetT > 0) G.magnetT -= dt;
  if (G.ghostT > 0) G.ghostT -= dt;
  if (G.dashT > 0) G.dashT -= dt;
  updateDragonTimer(dt);
  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }

  updateEvents(dt);

  G.speed = Math.min(C.SPEED_BASE + G.score * C.SPEED_PER_POINT, C.SPEED_MAX) * (G.dashT > 0 ? C.DASH_SPEED_MULT : G.dragonT > 0 ? C.DRAGON_SPEED_MULT : 1);
  const move = G.speed * tdt; G.distTot += move;

  recordGhost();
  updatePanda(tdt, dt);
  recordDragonTrail();
  if (updatePandaBounds()) return;
  updateSeason();
  updateMonkey(tdt, dt);
  if (updatePipes(move)) return;
  if (updateCranes(move, tdt)) return;
  updateCascades(move, tdt);
  if (updateBridges(move, dt)) return;
  if (updateCones(tdt)) return;
  updateDragonRain(dt);
  updateItems(move, tdt, dt);
  checkGhost();
  checkMissions();
}
