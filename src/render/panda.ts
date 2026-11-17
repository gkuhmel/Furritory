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

// Couleurs de la peluche : pelage orange, pattes et ventre brun chocolat, marques blanches.
const FUR = {
  orange: '#e8661e', light: '#f7924a', dark: '#c4521a',
  brown: '#5e3b2a', leg: '#4f3224', legFar: '#3c251a', paw: '#33201a',
  white: '#fff8ef', cream: '#f3e6d6', ink: '#1b1030', tear: '#9a4418',
};

// Patte en forme de boudin moelleux, orientée selon l'angle a.
function limb(c: C2D, x: number, y: number, a: number, len: number, wd: number, col: string): void {
  c.save(); c.translate(x, y); c.rotate(a);
  c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = wd;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
  c.fillStyle = FUR.paw; c.beginPath(); c.ellipse(len + 0.5, 0, wd * 0.5, wd * 0.46, 0, 0, 7); c.fill();
  c.restore();
}

// Queue épaisse et touffue, à larges anneaux orange / brun (bout brun), qui ondule et fouette au battement.
function drawTail(c: C2D, t: number, w: number): void {
  const n = 18;
  for (let i = n - 1; i >= 0; i--) {
    const k = i / (n - 1);
    const x = -11 - k * 30;
    const y = 4 + Math.sin(t * 6 - k * 3.2) * k * 3.4 + w * k * 6 + k * 2.5;
    const r = 8 - k * 2.4;
    const band = Math.floor(k * 5.99); // 0 orange, 1 brun, 2 orange, 3 brun, 4 orange, 5 bout brun
    const brown = band % 2 === 1 || band === 5;
    c.fillStyle = brown ? FUR.brown : FUR.orange;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = brown ? 'rgba(255,255,255,0.07)' : 'rgba(255,190,120,0.30)';
    c.beginPath(); c.ellipse(x, y - r * 0.5, r * 0.7, r * 0.3, 0, 0, 7); c.fill();
  }
}

// Corps dodu orange, ventre brun et mèches de poils sur le dos.
function drawBody(c: C2D, t: number): void {
  const g = c.createLinearGradient(0, -8, 0, 16);
  g.addColorStop(0, FUR.light); g.addColorStop(0.55, FUR.orange); g.addColorStop(1, FUR.dark);
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 4, 16.5, 11.5, 0, 0, 7); c.fill();
  c.save(); c.beginPath(); c.ellipse(0, 4, 16.5, 11.5, 0, 0, 7); c.clip();
  c.fillStyle = FUR.brown; c.beginPath(); c.ellipse(1, 16, 16, 7, 0, 0, 7); c.fill();
  c.restore();
  c.fillStyle = FUR.light;
  for (let i = 0; i < 3; i++) {
    const x = -10 + i * 7, s = Math.sin(t * 5 + i) * 0.8;
    c.beginPath(); c.moveTo(x - 3, -6.5); c.lineTo(x + 0.5 + s, -9.5); c.lineTo(x + 3, -6.5); c.fill();
  }
}

// Oreille : bord blanc duveteux, intérieur brun, petit frémissement.
function ear(c: C2D, x: number, y: number, a: number): void {
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = FUR.white; c.beginPath(); c.moveTo(-5.5, 2); c.quadraticCurveTo(-4, -10, 0, -10); c.quadraticCurveTo(4, -10, 5.5, 2); c.fill();
  c.fillStyle = FUR.brown; c.beginPath(); c.moveTo(-3.2, 1.5); c.quadraticCurveTo(-2.4, -6.5, 0, -6.8); c.quadraticCurveTo(2.4, -6.5, 3.2, 1.5); c.fill();
  c.restore();
}

// Tête (repère : centre de la tête, yeux en (-3,0) et (6,0) pour aligner les tenues).
function drawHead(c: C2D, t: number, dead: boolean): void {
  const twitch = Math.pow(Math.max(0, Math.sin(t * 1.7)), 30) * 0.45;
  ear(c, -7, -8, -0.45 - twitch);
  ear(c, 6, -9, 0.35 + twitch * 0.6);
  const g = c.createRadialGradient(-3, -4, 2, 0, 0, 14);
  g.addColorStop(0, FUR.light); g.addColorStop(1, FUR.orange);
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 13, 11, 0, 0, 7); c.fill();
  // marques blanches : sourcils, joues, museau
  c.fillStyle = FUR.white; c.beginPath();
  c.ellipse(-4, -6, 2.4, 1.5, -0.2, 0, 7); c.ellipse(6.5, -6, 2.2, 1.4, 0.2, 0, 7);
  c.ellipse(-8, 5, 4.6, 4, 0.3, 0, 7); c.ellipse(5.5, 5, 7.5, 5.2, 0, 0, 7); c.fill();
  c.fillStyle = FUR.cream; c.beginPath(); c.ellipse(8, 6.5, 4.5, 2.6, 0, 0, 7); c.fill();
  // larmes brunes typiques du panda roux
  c.fillStyle = FUR.tear; c.beginPath(); c.ellipse(-4, 4.5, 1.6, 2.6, 0.35, 0, 7); c.ellipse(5.5, 4.5, 1.5, 2.4, -0.35, 0, 7); c.fill();
  // joues roses
  c.fillStyle = 'rgba(255,120,140,0.35)'; c.beginPath(); c.ellipse(-8, 6, 2.6, 1.6, 0, 0, 7); c.fill();
  // yeux : brillants, clignent de temps en temps
  c.fillStyle = FUR.ink; c.strokeStyle = FUR.ink; c.lineWidth = 1.5; c.lineCap = 'round';
  if (dead) {
    c.beginPath(); c.moveTo(-5, -2); c.lineTo(-1, 2); c.moveTo(-1, -2); c.lineTo(-5, 2); c.moveTo(4, -2); c.lineTo(8, 2); c.moveTo(8, -2); c.lineTo(4, 2); c.stroke();
  } else if (t % 3.7 < 0.13) {
    c.beginPath(); c.arc(-3, -0.5, 2, 0.2, Math.PI - 0.2); c.moveTo(8, -0.5); c.arc(6, -0.5, 2, 0.2, Math.PI - 0.2); c.stroke();
  } else {
    c.beginPath(); c.ellipse(-3, 0, 2, 2.4, 0, 0, 7); c.ellipse(6, 0, 2, 2.4, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-2.3, -0.9, 0.8, 0, 7); c.arc(6.7, -0.9, 0.8, 0, 7); c.fill();
  }
  // truffe noire en bouton et petit sourire
  c.fillStyle = FUR.ink; c.beginPath(); c.ellipse(11, 3.6, 2.4, 1.9, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(10.4, 2.9, 0.6, 0, 7); c.fill();
  c.strokeStyle = FUR.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(11, 5.4); c.lineTo(11, 6.4); c.moveTo(7.5, 6.4); c.quadraticCurveTo(9.3, 8.4, 11, 6.4); c.quadraticCurveTo(12.4, 8, 13.6, 6.6); c.stroke();
}

export interface PandaOpts { rot?: number; alpha?: number; wing?: number; dead?: boolean; shield?: boolean; dash?: boolean }

export function drawPanda(c: C2D, eq: Partial<Equipment>, o: PandaOpts = {}): void {
  const t = G.t;
  c.save(); c.rotate(o.rot || 0); if (o.alpha != null) c.globalAlpha = o.alpha;
  if (o.dash) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-6, 0, 34, 22, 0, 0, 7); c.fill(); }
  if (o.shield) { c.strokeStyle = `rgba(255,207,74,${0.6 + Math.sin(t * 8) * 0.3})`; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,207,74,0.12)'; c.fill(); }
  const w = o.wing || 0;
  // étirement au battement d'ailes
  c.save(); c.scale(1 - 0.07 * w, 1 + 0.09 * w);
  const paddle = t * 9; // pattes qui pagaient dans l'air
  // patte arrière et patte avant du côté caché (plus sombres)
  limb(c, -5, 9, 2.55 + Math.sin(paddle + Math.PI) * 0.22 - w * 0.35, 12, 7, FUR.legFar);
  limb(c, 6, 9, 0.6 + Math.sin(paddle) * 0.28 + w * 0.4, 11, 6.5, FUR.legFar);
  drawTail(c, t, w);
  drawWing(c, eq.wings ?? 'leaf', -0.6 + w * 1.2 + Math.sin(t * 14) * 0.12);
  drawBody(c, t);
  // patte arrière et patte avant du côté visible
  limb(c, -9, 10, 2.8 + Math.sin(paddle) * 0.25 - w * 0.35, 13, 7.5, FUR.leg);
  limb(c, 9, 10, 0.35 + Math.sin(paddle + Math.PI) * 0.3 + w * 0.4, 12, 7, FUR.leg);
  // tête
  c.save(); c.translate(12, -6); c.rotate(Math.sin(t * 2.2) * 0.04);
  drawHead(c, t, !!o.dead);
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
