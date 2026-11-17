// Mise à jour d'une image de jeu (logique uniquement) et lancement de partie.
import * as C from './config';
import { G, reset, view } from './state';
import { lerpPal, snapPal, updateSeason } from './world/seasons';
import { THEMES } from './world/themes';
import { flyAway, updateFinish } from './world/level';
import { banner } from './world/fx';
import { resetAmb, updateScenery } from './world/scenery';
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

// Partie du mode infini (comportement du prototype).
export function startRun(): void {
  const fromLevel = G.mode === 'level';
  refreshMissions(); reset(); G.state = 'play';
  G.mode = 'endless'; G.world = 0; G.level = 0; G.def = null;
  if (fromLevel) { snapPal(0); resetAmb(); }
  G.panda.vy = C.START_VY;
}

// Niveau de l'aventure.
export function startLevel(w: number, l: number): void {
  refreshMissions(); reset(); G.state = 'play';
  G.mode = 'level'; G.world = w; G.level = l; G.def = C.levelDef(w, l);
  G.nextPipe = 120; // premier passage un peu plus loin
  snapPal(THEMES[w].pal); resetAmb();
  G.panda.vy = C.START_VY;
  banner(`${THEMES[w].name} · ${l + 1}`, '#fff', 28);
  if (l === 2 || l === 4 || l === 6) {
    const th = THEMES[w];
    const what = l === 2 ? th.flyerName : l === 4 ? th.columnName : th.barName;
    banner(`Nouveau : ${what} !`, '#ffd27a', 22);
  }
}

export function update(dt: number): void {
  G.t += dt;
  if (G.nearSlow > 0) G.nearSlow -= dt;
  // facteur de temps : ralenti « au pixel » et ralenti de la pêche (physique et défilement)
  const tdt = dt * (G.nearSlow > 0 ? C.PIXEL_SLOW_FACTOR : 1) * (G.slowmo > 0 ? C.PEACH_SLOW_FACTOR : 1);
  lerpPal(Math.min(1, dt * C.SEASON_FADE));
  updateScenery(dt, G.state === 'play' ? G.speed : C.MENU_SCROLL);
  updateFx(dt);

  if (G.state === 'menu' || G.state === 'shop' || G.state === 'map') { hoverPanda(dt, view.W); return; }
  if (G.state === 'over') { fallPanda(dt); return; }
  if (G.state === 'win') { flyAway(dt); return; }

  // minuteurs
  if (G.slowmo > 0) G.slowmo -= dt;
  if (G.magnetT > 0) G.magnetT -= dt;
  if (G.ghostT > 0) G.ghostT -= dt;
  if (G.dashT > 0) G.dashT -= dt;
  updateDragonTimer(dt);
  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }

  updateEvents(dt);

  const base = G.mode === 'level' ? G.def!.speed : Math.min(C.SPEED_BASE + G.score * C.SPEED_PER_POINT, C.SPEED_MAX);
  G.speed = base * (G.dashT > 0 ? C.DASH_SPEED_MULT : G.dragonT > 0 ? C.DRAGON_SPEED_MULT : 1);
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
  if (G.mode === 'level') updateFinish(move);
  if (G.mode === 'endless') checkGhost();
  checkMissions();
}
