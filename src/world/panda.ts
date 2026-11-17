// Physique du panda : battement, gravité, vent, sol et plafond.
import * as C from '../config';
import { S } from '../save';
import { G } from '../state';
import { clamp, rnd } from '../util';
import { sfx } from '../audio/sfx';
import { spawnTrail } from './fx';
import { die, hitShield } from './damage';

export function flap(): void {
  if (G.state !== 'play') return;
  const { panda } = G;
  panda.vy = G.dragonT > 0 ? C.DRAGON_FLAP_VY : C.FLAP_VY; panda.wing = 1; sfx.flap();
  for (let i = 0; i < 3; i++) G.parts.push({ x: panda.x - 14, y: panda.y + 8, vx: rnd(-120, -40), vy: rnd(20, 120), l: 0.4, ml: 0.4, c: '#9be37a', r: rnd(2, 4), g: 1 });
}

export function updatePanda(tdt: number, dt: number): void {
  const { panda } = G;
  if (G.dashT > 0) {
    // nuage-éclair : le panda se recentre
    panda.vy *= 0.85; panda.y += (C.H * C.PANDA_Y - panda.y) * 3 * dt;
    G.parts.push({ x: panda.x - 20, y: panda.y + rnd(-8, 8), vx: -300, vy: 0, l: 0.3, ml: 0.3, c: '#ffffff', r: rnd(3, 6), g: 0 });
  } else {
    const g = G.dragonT > 0 ? C.DRAGON_GRAVITY : C.GRAVITY;
    panda.vy += g * tdt;
    if (G.evt && G.evt.k === 'wind' && G.dragonT <= 0) panda.vy += G.evt.dir * C.WIND_FORCE * tdt;
    panda.y += panda.vy * tdt;
  }
  panda.rot = clamp(panda.vy / C.ROT_DIV, C.ROT_MIN, C.ROT_MAX); panda.wing = Math.max(0, panda.wing - dt * C.WING_DECAY);
}

// Traînée de la tenue, plafond et sol ; renvoie true si le panda tombe dans la rivière.
export function updatePandaBounds(): boolean {
  const { panda } = G;
  if (S.eq.trail !== 'none') spawnTrail(G.parts, panda.x - 16, panda.y + 2, S.eq.trail);
  if (panda.y < C.CEILING) { panda.y = C.CEILING; panda.vy = 0; }
  const floor = G.dragonT > 0 ? C.GROUND - C.DRAGON_FLOOR_OFFSET : C.GROUND - C.FLOOR_OFFSET;
  if (panda.y > floor) {
    if (G.dragonT > 0 || G.dashT > 0 || G.ghostT > 0) { panda.y = floor; panda.vy = C.FLOOR_BOUNCE_VY; }
    else if (G.shield) { hitShield(); panda.y = floor; panda.vy = C.SHIELD_BOUNCE_VY; }
    else { die('sol'); return true; }
  }
  return false;
}

// Panda qui plane derrière le menu et la boutique.
export function hoverPanda(dt: number, W: number): void {
  const { panda } = G, t = G.t;
  panda.y = C.H * 0.3 + Math.sin(t * 3) * 12; panda.x = W * 0.5; panda.rot = Math.sin(t * 3) * 0.1; panda.wing = (Math.sin(t * 10) + 1) / 2;
  G.distTot += C.MENU_DIST_SPEED * dt;
}

// Chute après la mort.
export function fallPanda(dt: number): void {
  const { panda } = G;
  if (panda.y < C.GROUND - 16) { panda.vy += C.DEATH_FALL_GRAVITY * dt; panda.y += panda.vy * dt; panda.rot = Math.min(panda.rot + C.DEATH_ROT_SPEED * dt, C.DEATH_ROT_MAX); }
}
