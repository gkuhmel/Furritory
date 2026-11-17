// Le panda et ses tenues, et le dragon céleste.
// drawPanda dessine dans un contexte déjà placé au centre du panda.
import type { Equipment } from '../save';
import { G } from '../state';
import { ctx } from './canvas';

type C2D = CanvasRenderingContext2D;

function drawWing(c: C2D, type: string, wa: number): void {
  const t = G.t;
  c.save(); c.translate(-2, -4); c.rotate(-wa);
  if (type === 'leaf') { c.fillStyle = '#6fd36a'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-10, -26, -30, -22); c.quadraticCurveTo(-18, -6, 0, 0); c.fill(); c.strokeStyle = '#3f9a3a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(-24, -20); c.stroke(); }
  if (type === 'lotus') { ([[-0.5, '#ffc2d6'], [0.5, '#ffc2d6'], [0, '#ff8fb3']] as const).forEach(([a, col]) => { c.save(); c.rotate(a * 0.7); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-8, -26, -22, -28); c.quadraticCurveTo(-20, -8, 0, 0); c.fill(); c.restore(); }); }
  if (type === 'fan') { c.fillStyle = '#e8343a'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 30, Math.PI * 1.02, Math.PI * 1.6); c.closePath(); c.fill(); c.strokeStyle = '#ffcf4a'; c.lineWidth = 1.2; for (let a = 1.02; a <= 1.6; a += 0.08) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a * Math.PI) * 30, Math.sin(a * Math.PI) * 30); c.stroke(); } c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 29, Math.PI * 1.02, Math.PI * 1.6); c.stroke(); }
  if (type === 'kite') { c.fillStyle = '#ff4a4a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-8, -24); c.lineTo(-32, -26); c.lineTo(-22, -4); c.closePath(); c.fill(); c.strokeStyle = '#ffcf4a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(-32, -26); c.moveTo(-8, -24); c.lineTo(-22, -4); c.stroke(); c.strokeStyle = '#ffcf4a'; c.beginPath(); c.moveTo(-32, -26); c.quadraticCurveTo(-38, -18 + Math.sin(t * 10) * 4, -44, -22); c.stroke(); }
  if (type === 'phoenix') { c.fillStyle = 'rgba(255,180,60,0.3)'; c.beginPath(); c.arc(-16, -16, 22, 0, 7); c.fill(); ([[-0.3, '#ff5a2a', 34], [0, '#ff9a2a', 30], [0.3, '#ffcf4a', 24]] as const).forEach(([a, col, len]) => { c.save(); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-len * 0.4, -len * 0.9, -len, -len * 0.75); c.quadraticCurveTo(-len * 0.6, -len * 0.2, 0, 0); c.fill(); c.restore(); }); }
  c.restore();
}

function scarfColor(id: string): string {
  return id === 'red' ? '#e8343a' : id === 'jade' ? '#2fbf9a' : id === 'night' ? '#3a3f9f' : id === 'rainbow' ? `hsl(${(G.t * 140) % 360},90%,60%)` : '#ffcf4a';
}

export interface PandaOpts { rot?: number; alpha?: number; wing?: number; dead?: boolean; shield?: boolean; dash?: boolean }

export function drawPanda(c: C2D, eq: Partial<Equipment>, o: PandaOpts = {}): void {
  const t = G.t;
  c.save(); c.rotate(o.rot || 0); if (o.alpha != null) c.globalAlpha = o.alpha;
  if (o.dash) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-6, 0, 34, 22, 0, 0, 7); c.fill(); }
  if (o.shield) { c.strokeStyle = `rgba(255,207,74,${0.6 + Math.sin(t * 8) * 0.3})`; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,207,74,0.12)'; c.fill(); }
  const sw = Math.sin(t * 8) * 0.25;
  // queue rayée
  c.save(); c.translate(-14, 4); c.rotate(0.3 + sw);
  for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#7a2e14' : '#e8642c'; c.beginPath(); c.ellipse(-6 - i * 6, i * 1.5, 7 - i * 0.4, 6.5 - i * 0.4, 0, 0, 7); c.fill(); }
  c.restore();
  drawWing(c, eq.wings ?? 'leaf', -0.6 + (o.wing || 0) * 1.2 + Math.sin(t * 14) * 0.12);
  c.fillStyle = '#e8642c'; c.beginPath(); c.ellipse(0, 4, 16, 12, 0, 0, 7); c.fill();
  c.fillStyle = '#4a1d10'; c.beginPath(); c.ellipse(-6, 13, 4, 5, 0, 0, 7); c.ellipse(6, 13, 4, 5, 0, 0, 7); c.fill();
  // tête
  c.save(); c.translate(12, -6);
  c.fillStyle = '#e8642c'; c.beginPath(); c.moveTo(-10, -8); c.lineTo(-7, -19); c.lineTo(-1, -10); c.fill(); c.beginPath(); c.moveTo(4, -10); c.lineTo(10, -18); c.lineTo(12, -6); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-8, -11); c.lineTo(-7, -16); c.lineTo(-3, -10); c.fill(); c.beginPath(); c.moveTo(6, -10); c.lineTo(9, -15); c.lineTo(10, -8); c.fill();
  c.fillStyle = '#f07a3a'; c.beginPath(); c.ellipse(0, 0, 13, 11, 0, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-5, -3, 4, 3, 0, 0, 7); c.ellipse(6, -3, 4, 3, 0, 0, 7); c.ellipse(4, 5, 8, 5, 0, 0, 7); c.fill();
  c.fillStyle = '#7a2e14'; c.beginPath(); c.ellipse(-3, 2, 2.5, 4, 0.4, 0, 7); c.ellipse(7, 2, 2.5, 4, -0.4, 0, 7); c.fill();
  c.fillStyle = '#1b1030';
  if (o.dead) { c.strokeStyle = '#1b1030'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-5, -2); c.lineTo(-1, 2); c.moveTo(-1, -2); c.lineTo(-5, 2); c.moveTo(4, -2); c.lineTo(8, 2); c.moveTo(8, -2); c.lineTo(4, 2); c.stroke(); }
  else { c.beginPath(); c.arc(-3, 0, 2, 0, 7); c.arc(6, 0, 2, 0, 7); c.fill(); }
  c.beginPath(); c.arc(11, 4, 2, 0, 7); c.fill();
  // lunettes
  if (eq.glasses === 'round') { c.strokeStyle = '#1b1030'; c.lineWidth = 1.3; c.beginPath(); c.arc(-3, 0, 3.8, 0, 7); c.moveTo(9.8, 0); c.arc(6, 0, 3.8, 0, 7); c.moveTo(0.8, 0); c.lineTo(2.2, 0); c.stroke(); }
  if (eq.glasses === 'sun') { c.fillStyle = '#1b1030'; c.beginPath(); c.ellipse(-3, 0, 4.5, 3.5, 0, 0, 7); c.ellipse(6, 0, 4.5, 3.5, 0, 0, 7); c.fill(); c.fillRect(0, -1, 3, 1.5); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(-5, -2, 2, 1); c.fillRect(4, -2, 2, 1); }
  if (eq.glasses === 'mono') { c.strokeStyle = '#ffcf4a'; c.lineWidth = 1.5; c.beginPath(); c.arc(6, 0, 4.2, 0, 7); c.stroke(); c.beginPath(); c.moveTo(9, 3); c.quadraticCurveTo(12, 10, 6, 14); c.stroke(); }
  // chapeaux
  if (eq.hat === 'cone') { c.fillStyle = '#d9b25a'; c.beginPath(); c.moveTo(-17, -8); c.lineTo(19, -8); c.lineTo(1, -25); c.closePath(); c.fill(); c.strokeStyle = '#a8823a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-8, -12); c.lineTo(10, -12); c.moveTo(-3, -17); c.lineTo(5, -17); c.stroke(); }
  if (eq.hat === 'band') { c.fillStyle = '#e8343a'; c.fillRect(-13, -10, 26, 4); c.save(); c.translate(-12, -8); c.rotate(0.5 + Math.sin(t * 12) * 0.3); c.fillRect(-12, -1.5, 12, 3); c.rotate(0.3); c.fillRect(-10, 1, 10, 3); c.restore(); }
  if (eq.hat === 'flower') { ['#ff8fb3', '#fff', '#ffd27a', '#ff8fb3', '#fff'].forEach((col, i) => { const a = Math.PI * (1.1 + i * 0.2); c.fillStyle = col; c.beginPath(); c.arc(Math.cos(a) * 12, Math.sin(a) * 10 - 2, 3.5, 0, 7); c.fill(); }); c.fillStyle = '#4fbf4a'; c.beginPath(); c.ellipse(-12, -6, 4, 2, 0.5, 0, 7); c.fill(); }
  if (eq.hat === 'mandarin') { c.fillStyle = '#1b1030'; c.beginPath(); c.ellipse(0, -11, 15, 3.5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, -15, 9, 6, 0, Math.PI, 0); c.fill(); c.fillStyle = '#e8343a'; c.beginPath(); c.arc(0, -22, 3, 0, 7); c.fill(); c.strokeStyle = '#2fbf9a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -14); c.quadraticCurveTo(-20, -12, -26, -4 + Math.sin(t * 6) * 2); c.stroke(); }
  if (eq.hat === 'horns') { c.fillStyle = '#ffcf4a'; c.beginPath(); c.moveTo(-6, -10); c.quadraticCurveTo(-10, -22, -18, -26); c.quadraticCurveTo(-10, -20, -2, -10); c.fill(); c.beginPath(); c.moveTo(3, -10); c.quadraticCurveTo(4, -24, 0, -30); c.quadraticCurveTo(8, -22, 7, -9); c.fill(); }
  c.restore();
  // écharpe
  c.fillStyle = scarfColor(eq.scarf ?? 'gold'); c.fillRect(2, -2, 10, 4); c.save(); c.translate(2, 0); c.rotate(0.4 + Math.sin(t * 12) * 0.3); c.fillRect(-16, -2, 16, 4); c.restore();
  c.restore();
}

export function drawDragon(): void {
  const { dragonT, panda, dragonHist } = G, t = G.t;
  if (dragonT <= 0) return;
  const a = dragonT < 0.6 ? dragonT / 0.6 : 1; ctx.save(); ctx.globalAlpha = a;
  const n = 16;
  for (let i = n; i >= 1; i--) {
    const x = panda.x - 4 - i * 13, y = (dragonHist[Math.min(i * 3, dragonHist.length - 1)] ?? panda.y) + 14;
    const r = Math.max(5, 13 - i * 0.45);
    ctx.fillStyle = i % 2 ? '#e8343a' : '#d02a30'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.5, r * 0.8, r * 0.35, 0, 0, 7); ctx.fill();
    if (i % 2 === 0) { ctx.fillStyle = '#2fbf9a'; ctx.beginPath(); ctx.moveTo(x - 4, y - r + 1); ctx.lineTo(x, y - r - 7); ctx.lineTo(x + 4, y - r + 1); ctx.fill(); }
    if (i === n) { ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 16, y - 8); ctx.lineTo(x - 14, y + 8); ctx.fill(); }
  }
  // tête
  const hx = panda.x + 16, hy = panda.y + 12;
  ctx.fillStyle = '#e8343a'; ctx.beginPath(); ctx.ellipse(hx, hy, 16, 11, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx + 14, hy + 3, 10, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.moveTo(hx - 4, hy - 8); ctx.quadraticCurveTo(hx - 14, hy - 24, hx - 22, hy - 20); ctx.lineTo(hx - 6, hy - 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + 6, hy - 3, 3.5, 0, 7); ctx.fill(); ctx.fillStyle = '#1b1030'; ctx.beginPath(); ctx.arc(hx + 7, hy - 3, 1.8, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(hx + 20, hy); ctx.quadraticCurveTo(hx + 34, hy - 10 + Math.sin(t * 8) * 6, hx + 44, hy - 4);
  ctx.moveTo(hx + 20, hy + 5); ctx.quadraticCurveTo(hx + 32, hy + 16 + Math.sin(t * 8 + 1) * 6, hx + 42, hy + 12); ctx.stroke();
  ctx.restore();
}
