// Particules, textes flottants et voiles d'écran (ralenti, fête, « au pixel », flash).
import { H } from '../config';
import { G, view } from '../state';
import { ctx } from './canvas';
import { txt } from './hud';

export function drawParticles(): void {
  for (const p of G.parts) {
    ctx.globalAlpha = Math.max(0, p.l / p.ml) * (p.a ?? 1); ctx.fillStyle = p.c; ctx.beginPath();
    if (p.sh === 'e') ctx.ellipse(p.x, p.y, p.r, p.r * 0.55, G.t * 3, 0, 7); else ctx.arc(p.x, p.y, p.r, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawPops(): void {
  for (const p of G.pops) { ctx.globalAlpha = Math.max(0, p.l); txt(p.txt, p.x, p.y, p.size, p.col); }
  ctx.globalAlpha = 1;
}

export function drawOverlays(): void {
  const W = view.W;
  if (G.slowmo > 0) { ctx.fillStyle = 'rgba(255,154,176,0.10)'; ctx.fillRect(0, 0, W, H); }
  if (G.evt && G.evt.k === 'festival') { ctx.fillStyle = 'rgba(60,10,70,0.18)'; ctx.fillRect(0, 0, W, H); }
  if (G.nearSlow > 0) {
    // bords assombris pendant le ralenti « au pixel »
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,0,40,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
}

export function drawFlash(): void {
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.6})`; ctx.fillRect(0, 0, view.W, H); }
}
