// Bambous, grues, cascades, ponts, pommes de pin et singe.
import { GROUND, PIPE_W } from '../config';
import { G } from '../state';
import type { Boss, Bridge, Cascade, Cone, Crane } from '../state';
import { css } from '../util';
import { pal } from '../world/seasons';
import { ctx } from './canvas';
import { leaf } from './scenery';

function bambooStalk(x: number, y1: number, y2: number, cap: 'top' | 'bottom'): void {
  const w = PIPE_W, g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, css(pal.bam[0])); g.addColorStop(0.35, css(pal.bam[1])); g.addColorStop(0.7, css(pal.bam[2])); g.addColorStop(1, css(pal.bam[3]));
  ctx.fillStyle = g; ctx.fillRect(x + 6, y1, w - 12, y2 - y1);
  ctx.fillStyle = css(pal.bam[3]);
  if (cap === 'top') for (let y = y2; y > y1; y -= 52) ctx.fillRect(x + 3, y - 3, w - 6, 6); else for (let y = y1; y < y2; y += 52) ctx.fillRect(x + 3, y - 3, w - 6, 6);
  const ey = cap === 'top' ? y2 - 14 : y1;
  ctx.fillRect(x, ey, w, 14); ctx.fillStyle = css(pal.bam[1]); ctx.fillRect(x + 4, ey + 3, w - 8, 4);
  if (pal.snow > 0.05 && cap === 'bottom') { ctx.fillStyle = `rgba(255,255,255,${pal.snow})`; ctx.beginPath(); ctx.ellipse(x + w / 2, y1, w / 2 + 3, 7, 0, Math.PI, 0); ctx.fill(); }
  ctx.fillStyle = G.curSeason === 2 ? '#e07a2a' : css(pal.bam[2]);
  const ly = cap === 'top' ? y2 - 40 : y1 + 40; leaf(x + w - 4, ly, 1); leaf(x + 4, ly + (cap === 'top' ? -60 : 60), -1);
}

export function drawPipes(): void {
  for (const p of G.pipes) {
    ctx.globalAlpha = p.smashed ? 0.3 : 1;
    bambooStalk(p.x, -20, p.cy - p.gap / 2, 'top'); bambooStalk(p.x, p.cy + p.gap / 2, GROUND, 'bottom');
    ctx.globalAlpha = 1;
  }
}

export function drawCrane(c: Crane): void {
  ctx.save(); ctx.translate(c.x, c.y); const f = Math.sin(G.t * 10 + c.ph);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(30, 7); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(13, 0, 6, 4, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-22, -6, -26, -12); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-27, -13, 4, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8343a'; ctx.beginPath(); ctx.arc(-27, -16, 2.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#d9b25a'; ctx.beginPath(); ctx.moveTo(-30, -14); ctx.lineTo(-42, -12); ctx.lineTo(-30, -11); ctx.fill();
  ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(0, -24 * f, 14, -30 * f); ctx.lineTo(10, -2); ctx.fill();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.moveTo(9, -22 * f); ctx.lineTo(14, -30 * f); ctx.lineTo(12, -12 * f); ctx.fill();
  ctx.restore();
}

export function drawCascade(c: Cascade): void {
  const t = G.t;
  const g = ctx.createLinearGradient(c.x, 0, c.x + c.w, 0);
  g.addColorStop(0, 'rgba(140,210,255,0.25)'); g.addColorStop(0.5, 'rgba(200,240,255,0.7)'); g.addColorStop(1, 'rgba(140,210,255,0.25)');
  ctx.fillStyle = g; ctx.fillRect(c.x, 18, c.w, GROUND - 18);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let k = 0; k < 6; k++) { const x = c.x + 3 + k * 7, off = (t * 420 + k * 57) % 80; for (let y = -80 + off; y < GROUND; y += 80) ctx.fillRect(x, y, 2, 28); }
  ctx.fillStyle = '#5a5070'; ctx.beginPath(); ctx.ellipse(c.x + c.w / 2, 10, c.w * 0.9, 18, 0, 0, 7); ctx.fill();
  ctx.fillStyle = css(pal.bam[2]); leaf(c.x + c.w + 6, 16, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(c.x + c.w / 2 + Math.sin(t * 6 + i) * c.w * 0.5, GROUND - 4 - Math.abs(Math.sin(t * 5 + i * 2)) * 10, 4, 0, 7); ctx.fill(); }
  // flèches pour indiquer la poussée
  ctx.fillStyle = 'rgba(30,80,140,0.5)';
  for (let y = (t * 120) % 90 + 60; y < GROUND - 20; y += 90) { ctx.beginPath(); ctx.moveTo(c.x + c.w / 2 - 8, y); ctx.lineTo(c.x + c.w / 2 + 8, y); ctx.lineTo(c.x + c.w / 2, y + 10); ctx.fill(); }
}

export function drawBridge(b: Bridge): void {
  ctx.save(); ctx.translate(0, b.fall); if (b.broken) ctx.globalAlpha = Math.max(0, 1 - b.fall / 300);
  ctx.fillStyle = '#6a3e1a'; ctx.fillRect(b.x - 6, b.y - 26, 6, 40); ctx.fillRect(b.x + b.len, b.y - 26, 6, 40);
  ctx.strokeStyle = '#d9b25a'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 16; i++) { const u = i / 16; ctx.lineTo(b.x + u * b.len, b.y - 18 + Math.sin(Math.PI * u) * 12); }
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const u = (i + 0.5) / 8, px = b.x + u * b.len, py = b.y + Math.sin(Math.PI * u) * 14;
    ctx.fillStyle = '#b07a3a'; ctx.fillRect(px - 5, py - 4, 10, 8); ctx.fillStyle = '#7a4a20'; ctx.fillRect(px - 5, py + 2, 10, 2);
    ctx.strokeStyle = 'rgba(217,178,90,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py - 4); ctx.lineTo(px, b.y - 18 + Math.sin(Math.PI * u) * 12); ctx.stroke();
  }
  ctx.restore();
}

export function drawCone(c: Cone): void {
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.fillStyle = '#7a4a20'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 12, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 1.5;
  for (let i = -6; i <= 6; i += 4) { ctx.beginPath(); ctx.moveTo(-8, i); ctx.lineTo(0, i + 4); ctx.lineTo(8, i); ctx.stroke(); }
  ctx.restore();
}

function drawConeAt(): void { ctx.fillStyle = '#7a4a20'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 8, 0, 0, 7); ctx.fill(); }

export function drawMonkey(m: Boss): void {
  ctx.save(); ctx.translate(m.x, m.y);
  ctx.fillStyle = '#fff';
  ([[-20, 24, 14], [0, 28, 17], [20, 24, 14], [-8, 18, 12], [10, 18, 12]] as const).forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
  ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10, 10); ctx.quadraticCurveTo(32, 4, 26, -14); ctx.quadraticCurveTo(22, -22, 16, -16); ctx.stroke();
  ctx.fillStyle = '#9a6a3a'; ctx.beginPath(); ctx.arc(0, 6, 14, 0, 7); ctx.fill();
  // bras qui lance
  ctx.save(); ctx.translate(-10, 0); ctx.rotate(-0.4 - m.arm * 1.6); ctx.fillStyle = '#9a6a3a'; ctx.fillRect(-3, -18, 6, 18);
  if (m.arm < 0.2 && m.phase === 'fight') { ctx.translate(0, -20); drawConeAt(); }
  ctx.restore();
  ctx.fillStyle = '#9a6a3a'; ctx.beginPath(); ctx.arc(0, -14, 12, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(-12, -16, 5, 0, 7); ctx.arc(12, -16, 5, 0, 7); ctx.fill();
  ctx.fillStyle = '#f2d0a0'; ctx.beginPath(); ctx.ellipse(0, -11, 8, 7, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(-12, -16, 2.5, 0, 7); ctx.arc(12, -16, 2.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#1b1030'; ctx.beginPath(); ctx.arc(-3, -14, 1.8, 0, 7); ctx.arc(3, -14, 1.8, 0, 7); ctx.fill();
  ctx.strokeStyle = '#1b1030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -9, 3.5, 0.2, 2.9); ctx.stroke();
  ctx.fillStyle = '#ffcf4a'; ctx.fillRect(-11, -25, 22, 3.5);
  ctx.restore();
}
