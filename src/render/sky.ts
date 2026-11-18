// Ciel et soleil.
import { H } from '../config';
import { view } from '../state';
import { css } from '../util';
import { pal } from '../world/seasons';
import { scenery } from '../world/scenery';
import { G } from '../state';
import { ctx } from './canvas';

export function drawSky(): void {
  const W = view.W;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  [0, 0.35, 0.65, 1].forEach((s, i) => g.addColorStop(s, css(pal.sky[i])));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = css(pal.sun, 0.9); ctx.beginPath(); ctx.arc(W * 0.75, 150, 52, 0, 7); ctx.fill();
  ctx.fillStyle = css(pal.sun, 0.22); ctx.beginPath(); ctx.arc(W * 0.75, 150, 82, 0, 7); ctx.fill();
  // rayons de soleil qui tournent lentement
  ctx.save(); ctx.translate(W * 0.75, 150); ctx.rotate(G.t * 0.05);
  ctx.fillStyle = css(pal.sun, 0.07);
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(520, -40); ctx.lineTo(520, 40); ctx.fill(); }
  ctx.restore();
  // nuages qui dérivent
  for (const c of scenery.clouds) cloud(c.x, c.y, c.s);
}

function cloud(x: number, y: number, s: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = css(pal.sky[0], 0.35);
  ctx.beginPath(); ctx.ellipse(4, 14, 58, 12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.beginPath(); ctx.arc(-30, 4, 18, 0, 7); ctx.arc(-8, -8, 24, 0, 7); ctx.arc(18, -2, 20, 0, 7); ctx.arc(38, 6, 14, 0, 7); ctx.ellipse(4, 10, 50, 12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-12, -14, 10, 0, 7); ctx.fill();
  ctx.restore();
}
