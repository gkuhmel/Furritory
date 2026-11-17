// Singe farceur : mini-boss qui lance pommes de pin et pêches.
import * as C from '../config';
import { G, view } from '../state';
import { rnd } from '../util';
import { sfx } from '../audio/sfx';
import { banner, burst, pop } from './fx';
import { collide } from './damage';

export function updateMonkey(tdt: number, dt: number): void {
  const { panda } = G;
  const W = view.W;
  const due = G.mode === 'endless'
    ? G.score >= G.nextBoss
    : G.def!.boss && !G.bossDone && G.pairsSpawned >= Math.round(G.def!.pairs * C.LEVEL_BOSS_AT);
  if (!G.boss && due && G.dragonT <= 0) {
    G.boss = { x: W + 70, y: 200, phase: 'in', t: 0, throwT: C.MONKEY_FIRST_THROW, arm: 0, life: C.MONKEY_LIFE };
    banner('🐒 Le singe farceur arrive !', '#ffd27a', 26);
  }
  const boss = G.boss;
  if (!boss) return;
  boss.t += tdt; boss.arm = Math.max(0, boss.arm - dt * 3);
  const tx = W - 70;
  if (boss.phase === 'in') { boss.x += (tx - boss.x) * 3 * dt; if (Math.abs(boss.x - tx) < 3) boss.phase = 'fight'; }
  if (boss.phase === 'fight') {
    boss.y = 230 + Math.sin(boss.t * 1.2) * 140; boss.life -= tdt; boss.throwT -= tdt;
    if (boss.throwT <= 0) {
      boss.throwT = rnd(C.MONKEY_THROW_MIN, C.MONKEY_THROW_MAX); boss.arm = 1; sfx.throw();
      // tir en cloche visé sur le panda
      const vx = -rnd(C.MONKEY_THROW_VX_MIN, C.MONKEY_THROW_VX_MAX), T = (boss.x - panda.x) / -vx, g = C.PROJECTILE_GRAVITY;
      const vy = (panda.y + rnd(-20, 20) - boss.y - 0.5 * g * T * T) / T;
      if (Math.random() < C.MONKEY_PEACH_CHANCE) G.items.push({ type: 'peach', x: boss.x - 20, y: boss.y - 10, r: 15, ph: 0, vx, vy, thrown: true });
      else G.cones.push({ x: boss.x - 20, y: boss.y - 10, vx, vy, rot: 0 });
    }
    if (boss.life <= 0) {
      boss.phase = 'out'; G.score += C.MONKEY_BONUS; G.stats.monkey++;
      pop(W / 2, 200, `Singe semé ! +${C.MONKEY_BONUS}`, '#ffd27a', 26); sfx.power();
    }
  }
  if (boss.phase === 'out') {
    boss.x += 260 * dt; boss.y -= 60 * dt;
    if (boss.x > W + 90) { G.boss = null; G.bossDone = true; G.nextBoss = G.score + C.MONKEY_EVERY; G.nextPipe = C.MONKEY_NEXT_PIPE; }
  }
}

// Pommes de pin lancées par le singe.
export function updateCones(tdt: number): boolean {
  const { panda } = G;
  for (const c of G.cones) {
    c.x += c.vx * tdt; c.y += c.vy * tdt; c.vy += C.PROJECTILE_GRAVITY * tdt; c.rot += 8 * tdt;
    if (!c.dead && Math.hypot(panda.x - c.x, panda.y - c.y) < C.CONE_HIT) {
      const r = collide('pomme'); if (r === 'dead') return true;
      c.dead = true; burst(c.x, c.y, '#8a5a2a', 10, 180);
    }
  }
  G.cones = G.cones.filter(c => !c.dead && c.x > -30 && c.y < C.H + 30);
  return false;
}
