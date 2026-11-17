// Ciel et soleil.
import { H } from '../config';
import { view } from '../state';
import { css } from '../util';
import { pal } from '../world/seasons';
import { ctx } from './canvas';

export function drawSky(): void {
  const W = view.W;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  [0, 0.35, 0.65, 1].forEach((s, i) => g.addColorStop(s, css(pal.sky[i])));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = css(pal.sun, 0.9); ctx.beginPath(); ctx.arc(W * 0.75, 150, 52, 0, 7); ctx.fill();
  ctx.fillStyle = css(pal.sun, 0.22); ctx.beginPath(); ctx.arc(W * 0.75, 150, 82, 0, 7); ctx.fill();
}
