// Dessin d'une image complète, dans l'ordre des plans du prototype.
import { S } from '../save';
import { G, view } from '../state';
import { rnd } from '../util';
import { ghostY } from '../world/ghost';
import { ctx } from './canvas';
import { drawSky } from './sky';
import { drawAmb, drawFarBamboo, drawFog, drawGround, drawLanterns, drawMountains, drawWind } from './scenery';
import { drawBarAny, drawColumnAny, drawCone, drawFinish, drawFlyer, drawMonkey, drawPipes } from './obstacles';
import { drawFarLayer } from './themed';
import { theme } from '../world/level';
import { drawItems } from './items';
import { drawDragon, drawPanda } from './panda';
import { drawFlash, drawOverlays, drawParticles, drawPops } from './fx';
import { drawHud } from './hud';
import { drawOutlined } from './outline';

const GHOST_EQ = { hat: 'none', scarf: 'night', glasses: 'none', wings: 'leaf' };

export function render(): void {
  const { panda } = G, t = G.t;
  ctx.save();
  if (G.shake > 0) ctx.translate(rnd(-6, 6) * G.shake * 2, rnd(-6, 6) * G.shake * 2);
  drawSky(); drawLanterns(); drawMountains(); if (theme().far === 'bamboo') drawFarBamboo(); else drawFarLayer();
  G.cascades.forEach(drawColumnAny); drawPipes(); drawFinish(); G.bridges.forEach(drawBarAny); drawItems(); G.cranes.forEach(drawFlyer); G.cones.forEach(drawCone);
  drawGround();
  if (G.boss) drawMonkey(G.boss);
  drawParticles();
  // fantôme du record
  const gy = ghostY();
  if (gy != null) { ctx.save(); ctx.translate(panda.x, gy); drawPanda(ctx, GHOST_EQ, { alpha: 0.28, wing: (Math.sin(t * 10) + 1) / 2 }); ctx.restore(); }
  drawDragon();
  ctx.save(); ctx.translate(panda.x, panda.y);
  const blink = G.ghostT > 0 && G.dragonT <= 0 && Math.floor(t * 20) % 2;
  if (G.state === 'menu' || G.state === 'map') ctx.scale(view.menuScale, view.menuScale);
  // halo du nuage-éclair et bouclier, hors contour
  drawPanda(ctx, S.eq, { fxOnly: true, dash: G.dashT > 0, shield: G.shield });
  drawOutlined(ctx, 150, 130, c => drawPanda(c, S.eq, { rot: panda.rot, wing: panda.wing, dead: G.state === 'over' }), '#3a1408', 1.4, blink ? 0.4 : 1);
  ctx.restore();
  drawAmb(); drawWind(); drawFog();
  drawPops();
  drawOverlays();
  if (G.state === 'play' || G.state === 'win') drawHud();
  drawFlash();
  ctx.restore();
}
