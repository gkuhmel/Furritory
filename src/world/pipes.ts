// Paires de bambous : apparition (avec obstacles et bonus associés), défilement, frôlements.
import * as C from '../config';
import { G, inv, view } from '../state';
import { clamp, css, rnd } from '../util';
import { sfx } from '../audio/sfx';
import { burst, pop } from './fx';
import { collide } from './damage';
import { pal } from './seasons';
import { spawnCrane } from './cranes';
import { spawnCascade } from './cascades';
import { spawnBridge } from './bridges';
import { spawnSlotItems } from './items';

export function spawnSlot(): void {
  if (G.mode === 'level') { spawnLevelSlot(); return; }
  const gap = clamp(C.GAP0 - G.score * C.GAP_SHRINK, C.GAP_MIN, C.GAP0), margin = C.PIPE_MARGIN;
  let lo = margin + gap / 2, hi = C.GROUND - margin - gap / 2;
  const fs = G.forceSide;
  if (fs) {
    const a = fs.above ? [lo, fs.y - C.FORCE_SIDE_MARGIN - gap / 2] : [fs.y + C.FORCE_SIDE_MARGIN + gap / 2, hi];
    if (a[1] > a[0]) { lo = a[0]; hi = a[1]; }
  }
  const cy = rnd(lo, hi);
  const canSway = !fs && Math.random() < Math.min(C.SWAY_MAX_CHANCE, G.score * C.SWAY_PER_POINT);
  const p = { x: view.W + 40, cy, base: cy, gap, passed: false, sway: canSway ? rnd(C.SWAY_AMP_MIN, C.SWAY_AMP_MAX) : 0, ph: rnd(0, 6), freq: C.SWAY_FREQ };
  G.pipes.push(p); G.forceSide = null;
  const ix = p.x + C.PIPE_W + (C.SPACING - C.PIPE_W) / 2;
  const r = Math.random(); let extra = false;
  if (G.score >= C.CRANE_MIN_SCORE && r < C.CRANE_CHANCE) { extra = true; spawnCrane(ix, cy); }
  else if (G.score >= C.CASCADE_MIN_SCORE && r < C.CASCADE_CHANCE) { extra = true; spawnCascade(ix); }
  else if (G.score >= C.BRIDGE_MIN_SCORE && r < C.BRIDGE_CHANCE) { extra = true; spawnBridge(ix, cy); }
  spawnSlotItems(p.x + C.PIPE_W / 2, ix, cy, extra);
}

// Passage d'un niveau de l'aventure : réglages du niveau, lettres CHOCO, obstacles du monde.
function spawnLevelSlot(): void {
  const d = G.def!;
  const idx = G.pairsSpawned++;
  const gap = d.gap, margin = C.PIPE_MARGIN;
  let lo = margin + gap / 2, hi = C.GROUND - margin - gap / 2;
  const fs = G.forceSide;
  if (fs) {
    const a = fs.above ? [lo, fs.y - C.FORCE_SIDE_MARGIN - gap / 2] : [fs.y + C.FORCE_SIDE_MARGIN + gap / 2, hi];
    if (a[1] > a[0]) { lo = a[0]; hi = a[1]; }
  }
  const cy = rnd(lo, hi);
  const canSway = !fs && Math.random() < d.sway;
  const p = { x: view.W + 40, cy, base: cy, gap, passed: false, sway: canSway ? rnd(C.SWAY_AMP_MIN, Math.max(C.SWAY_AMP_MIN, d.swayAmp)) : 0, ph: rnd(0, 6), freq: d.swayFreq };
  G.pipes.push(p); G.forceSide = null;
  const ix = p.x + C.PIPE_W + (d.spacing - C.PIPE_W) / 2;
  // lettre CHOCO dans le trou, de plus en plus près des bords
  const li = C.LETTER_POS.findIndex(f => Math.round(f * (d.pairs - 1)) === idx);
  if (li >= 0) {
    const side = li % 2 ? 1 : -1;
    G.items.push({ type: 'letter', idx: li, x: p.x + C.PIPE_W / 2, y: cy + side * gap * d.letterEdge, r: 15, ph: rnd(0, 6) });
  }
  const last = idx >= d.pairs - 1;
  const r = Math.random(); let extra = false;
  if (!last) {
    if (r < d.flyer) { extra = true; spawnCrane(ix, cy); }
    else if (r < d.flyer + d.column) { extra = true; spawnCascade(ix); }
    else if (r < d.flyer + d.column + d.bar) { extra = true; spawnBridge(ix, cy); }
  }
  spawnSlotItems(p.x + C.PIPE_W / 2, ix, cy, extra || last, li >= 0);
}

// Renvoie true si le panda est mort (la mise à jour s'arrête là).
export function updatePipes(move: number): boolean {
  const { panda } = G;
  if (!G.boss) {
    G.nextPipe -= move;
    if (G.nextPipe <= 0) {
      if (G.mode === 'level' && G.pairsSpawned >= G.def!.pairs) {
        // plus de passages : l'arche d'arrivée
        if (!G.finish) G.finish = { x: view.W + 60, passed: false };
        G.nextPipe = Infinity;
      } else { spawnSlot(); G.nextPipe = G.mode === 'level' ? G.def!.spacing : C.SPACING; }
    }
  }
  for (const p of G.pipes) {
    p.x -= move; if (p.sway) p.cy = p.base + Math.sin(G.t * p.freq + p.ph) * p.sway;
    const inX = panda.x + C.HIT_HALF_W > p.x && panda.x - C.HIT_HALF_W < p.x + C.PIPE_W;
    const top = p.cy - p.gap / 2, bot = p.cy + p.gap / 2;
    if (inX && !p.smashed && (panda.y - C.HIT_HALF_H < top || panda.y + C.HIT_HALF_H > bot)) {
      const r = collide('bambou'); if (r === 'dead') return true;
      if (r === 'smash') { p.smashed = true; G.stats.smash++; burst(p.x + C.PIPE_W / 2, panda.y, css(pal.bam[1]), 16, 260); G.shake = 0.12; }
    }
    if (!p.passed && p.x + C.PIPE_W < panda.x - C.HIT_HALF_W) {
      p.passed = true; G.passed++;
      const d = Math.min(Math.abs(panda.y - top), Math.abs(bot - panda.y));
      let gain = 1;
      if (d < C.NEAR_DIST && !inv() && !p.smashed) {
        G.combo++; G.comboT = C.COMBO_TIME; gain += G.combo; G.stats.near++; G.stats.maxCombo = Math.max(G.stats.maxCombo, G.combo); sfx.near();
        if (d < C.PIXEL_DIST) { G.nearSlow = C.PIXEL_SLOW_TIME; pop(panda.x + 10, panda.y - 38, 'AU PIXEL ! ×' + G.combo, '#7df9ff', 24); }
        else pop(panda.x + 10, panda.y - 34, G.combo > 1 ? `Frôlé ×${G.combo} !` : 'Frôlé !', '#7df9ff', 20);
      }
      G.score += gain; sfx.point(); pop(panda.x, panda.y - 14, '+' + gain, '#fff', 18);
    }
  }
  G.pipes = G.pipes.filter(p => p.x > -C.PIPE_W - 20);
  return false;
}
