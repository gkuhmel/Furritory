// Dessin d'une image complète, dans l'ordre des plans du prototype.
import { S } from '../save';
import { G } from '../state';
import { rnd } from '../util';
import { ghostY } from '../world/ghost';
import { ctx } from './canvas';
import { drawSky } from './sky';
import { drawAmb, drawFarBamboo, drawFog, drawGround, drawLanterns, drawMountains, drawWind } from './scenery';
import { drawBridge, drawCascade, drawCone, drawCrane, drawMonkey, drawPipes } from './obstacles';
import { drawItems } from './items';
import { drawDragon, drawPanda } from './panda';
import { drawFlash, drawOverlays, drawParticles, drawPops } from './fx';
import { drawHud } from './hud';

const GHOST_EQ = { hat: 'none', scarf: 'night', glasses: 'none', wings: 'leaf' };

export function render(): void {
  const { panda } = G, t = G.t;
  ctx.save();
  if (G.shake > 0) ctx.translate(rnd(-6, 6) * G.shake * 2, rnd(-6, 6) * G.shake * 2);
  drawSky(); drawLanterns(); drawMountains(); drawFarBamboo();
  G.cascades.forEach(drawCascade); drawPipes(); G.bridges.forEach(drawBridge); drawItems(); G.cranes.forEach(drawCrane); G.cones.forEach(drawCone);
  drawGround();
  if (G.boss) drawMonkey(G.boss);
  drawParticles();
  // fantôme du record
  const gy = ghostY();
  if (gy != null) { ctx.save(); ctx.translate(panda.x, gy); drawPanda(ctx, GHOST_EQ, { alpha: 0.28, wing: (Math.sin(t * 10) + 1) / 2 }); ctx.restore(); }
  drawDragon();
  ctx.save(); ctx.translate(panda.x, panda.y);
  const blink = G.ghostT > 0 && G.dragonT <= 0 && Math.floor(t * 20) % 2;
  drawPanda(ctx, S.eq, { rot: panda.rot, wing: panda.wing, dead: G.state === 'over', alpha: blink ? 0.4 : 1, shield: G.shield, dash: G.dashT > 0 });
  ctx.restore();
  drawAmb(); drawWind(); drawFog();
  drawPops();
  drawOverlays();
  if (G.state === 'play') drawHud();
  drawFlash();
  ctx.restore();
}
