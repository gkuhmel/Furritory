// Habillage des obstacles et du décor lointain selon le monde.
import { GROUND, PIPE_W } from '../config';
import { G, view } from '../state';
import type { Bridge, Cascade, Crane } from '../state';
import { theme } from '../world/level';
import { scenery } from '../world/scenery';
import { ctx } from './canvas';

type Cap = 'top' | 'bottom';

// ---------- Piliers (à la place des bambous) ----------
function vgrad(x: number, cols: string[]): CanvasGradient {
  const g = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
  cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
  return g;
}

// Poteau de bois des rizières : liens de paille, chapeau d'épouvantail en bas, frange en haut.
export function polePillar(x: number, y1: number, y2: number, cap: Cap): void {
  const w = PIPE_W;
  ctx.fillStyle = vgrad(x, ['#5a3418', '#a8743e', '#8a5a2c', '#4a2a12']); ctx.fillRect(x + 12, y1, w - 24, y2 - y1);
  ctx.fillStyle = '#d9b25a';
  for (let y = cap === 'top' ? y2 - 30 : y1 + 30; cap === 'top' ? y > y1 : y < y2; y += cap === 'top' ? -46 : 46) { ctx.fillRect(x + 9, y - 3, w - 18, 6); ctx.fillStyle = '#b8903a'; ctx.fillRect(x + 9, y + 1, w - 18, 2); ctx.fillStyle = '#d9b25a'; }
  if (cap === 'bottom') {
    // chapeau de paille posé sur le poteau
    ctx.fillStyle = '#e8c870'; ctx.beginPath(); ctx.moveTo(x - 6, y1 + 6); ctx.lineTo(x + w + 6, y1 + 6); ctx.lineTo(x + w / 2, y1 - 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a8823a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 10, y1); ctx.lineTo(x + w - 10, y1); ctx.stroke();
  } else {
    ctx.fillStyle = '#6a3e1a'; ctx.fillRect(x + 4, y2 - 12, w - 8, 12);
    ctx.fillStyle = '#e8c870';
    for (let i = 0; i < 7; i++) { const fx = x + 8 + i * 8; ctx.fillRect(fx, y2, 3, 8 + Math.sin(G.t * 4 + i) * 2); }
  }
}

// Pilier de temple laqué rouge, bagues dorées, chapiteau en avant-toit.
export function templePillar(x: number, y1: number, y2: number, cap: Cap): void {
  const w = PIPE_W;
  ctx.fillStyle = vgrad(x, ['#8a1418', '#e8434a', '#c8282e', '#6a0e12']); ctx.fillRect(x + 8, y1, w - 16, y2 - y1);
  ctx.fillStyle = '#ffcf4a';
  for (let y = cap === 'top' ? y2 - 60 : y1 + 60; cap === 'top' ? y > y1 : y < y2; y += cap === 'top' ? -90 : 90) ctx.fillRect(x + 6, y - 3, w - 12, 6);
  const ey = cap === 'top' ? y2 : y1;
  const dir = cap === 'top' ? -1 : 1;
  ctx.fillStyle = '#ffcf4a'; ctx.fillRect(x + 2, ey + (cap === 'top' ? -16 : 4), w - 4, 12);
  // avant-toit recourbé
  ctx.fillStyle = '#2a1a3a'; ctx.beginPath();
  ctx.moveTo(x - 12, ey - dir * 2); ctx.quadraticCurveTo(x + w / 2, ey + dir * 10, x + w + 12, ey - dir * 2);
  ctx.lineTo(x + w + 4, ey + dir * 8); ctx.quadraticCurveTo(x + w / 2, ey + dir * 14, x - 4, ey + dir * 8); ctx.fill();
  if (cap === 'top') {
    // lanterne suspendue
    const lx = x + w / 2, ly = y2 + 22 + Math.sin(G.t * 2 + x) * 2;
    ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, y2 + 6); ctx.lineTo(lx, ly - 8); ctx.stroke();
    ctx.fillStyle = 'rgba(255,200,100,0.35)'; ctx.beginPath(); ctx.arc(lx, ly, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.ellipse(lx, ly, 7, 9, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf4a'; ctx.fillRect(lx - 4, ly - 10, 8, 2); ctx.fillRect(lx - 4, ly + 8, 8, 2);
  }
}

// Pic de glace : colonne givrée, pointes de stalactites en haut, rocher enneigé en bas.
export function icePillar(x: number, y1: number, y2: number, cap: Cap): void {
  const w = PIPE_W;
  ctx.fillStyle = vgrad(x, ['#3f6fa8', '#d8f0ff', '#86bce6', '#2f5f98']);
  if (cap === 'top') {
    ctx.fillRect(x + 6, y1, w - 12, y2 - y1 - 16);
    ctx.beginPath(); ctx.moveTo(x + 6, y2 - 16);
    for (let i = 0; i < 4; i++) { const sx = x + 6 + i * (w - 12) / 4; ctx.lineTo(sx + (w - 12) / 8, y2 - (i % 2 ? 4 : 0)); ctx.lineTo(sx + (w - 12) / 4, y2 - 16); }
    ctx.fill();
  } else {
    ctx.fillRect(x + 6, y1 + 10, w - 12, y2 - y1 - 10);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x + w / 2, y1 + 10, w / 2 + 2, 12, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(x + 4, y1 + 8, w - 8, 6);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x + 14, y1, 4, y2 - y1 - 16);
  ctx.strokeStyle = 'rgba(90,140,190,0.5)'; ctx.lineWidth = 1.5;
  for (let y = y1 + 30; y < y2 - 30; y += 70) { ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.lineTo(x + 34, y + 14); ctx.lineTo(x + 28, y + 30); ctx.stroke(); }
}

// Colonne de jade : anneaux dorés et nuage au bout.
export function jadePillar(x: number, y1: number, y2: number, cap: Cap): void {
  const w = PIPE_W;
  ctx.fillStyle = vgrad(x, ['#1f6a52', '#8fe8c0', '#4fc49a', '#1a5a46']); ctx.fillRect(x + 8, y1, w - 16, y2 - y1);
  ctx.fillStyle = '#ffd24a';
  for (let y = cap === 'top' ? y2 - 50 : y1 + 50; cap === 'top' ? y > y1 : y < y2; y += cap === 'top' ? -70 : 70) {
    ctx.fillRect(x + 6, y - 4, w - 12, 8); ctx.fillStyle = '#c89a20'; ctx.fillRect(x + 6, y + 2, w - 12, 2); ctx.fillStyle = '#ffd24a';
  }
  const ey = cap === 'top' ? y2 - 4 : y1 + 4;
  ctx.fillStyle = '#ffffff';
  ([[-4, 0, 12], [12, -3, 14], [30, 0, 15], [48, -2, 13], [62, 1, 10]] as const).forEach(([dx, dy, r]) => {
    ctx.beginPath(); ctx.arc(x + dx + 2, ey + dy * (cap === 'top' ? -1 : 1), r * 0.8 + Math.sin(G.t * 2 + dx) * 0.8, 0, 7); ctx.fill();
  });
}

// ---------- Obstacles volants ----------
export function drawKite(c: Crane): void {
  const t = G.t;
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.sin(t * 3 + c.ph) * 0.15);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, 14); ctx.quadraticCurveTo(30, 60, 60, 140); ctx.stroke();
  ctx.fillStyle = '#ff4a5a'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, 0); ctx.lineTo(0, 16); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(-14, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1b1030'; ctx.beginPath(); ctx.arc(-3, -3, 1.6, 0, 7); ctx.arc(4, -3, 1.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 16);
  for (let i = 1; i <= 5; i++) ctx.lineTo(Math.sin(t * 8 + i) * 5 + i * 3, 16 + i * 7); ctx.stroke();
  ctx.restore();
}

export function drawRocket(c: Crane): void {
  const t = G.t;
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.sin(t * 6 + c.ph) * 0.1);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,207,74,0.8)' : 'rgba(255,120,60,0.7)'; ctx.beginPath(); ctx.arc(18 + i * 6 + Math.random() * 3, Math.sin(t * 20 + i) * 3, 4 - i * 0.5, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#e8343a'; ctx.fillRect(-10, -6, 24, 12);
  ctx.fillStyle = '#ffcf4a'; ctx.fillRect(-4, -6, 3, 12); ctx.fillRect(6, -6, 3, 12);
  ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.moveTo(-10, -7); ctx.lineTo(-22, 0); ctx.lineTo(-10, 7); ctx.fill();
  ctx.fillStyle = '#8a1418'; ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(20, -11); ctx.lineTo(20, -4); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(20, 11); ctx.lineTo(20, 4); ctx.fill();
  ctx.restore();
}

export function drawSnowball(c: Crane): void {
  const t = G.t;
  ctx.save(); ctx.translate(c.x, c.y);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(18, -8 + i * 8); ctx.lineTo(34 + i * 4, -8 + i * 8); ctx.stroke(); }
  ctx.rotate(-t * 6);
  const g = ctx.createRadialGradient(-5, -5, 2, 0, 0, 16); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b8d0ea');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(140,170,210,0.6)'; ctx.beginPath(); ctx.arc(5, 3, 3, 0, 7); ctx.arc(-6, 6, 2, 0, 7); ctx.arc(2, -8, 2.2, 0, 7); ctx.fill();
  ctx.restore();
}

export function drawStormcloud(c: Crane): void {
  const t = G.t;
  ctx.save(); ctx.translate(c.x, c.y);
  if (Math.sin(t * 9 + c.ph) > 0.3) { ctx.strokeStyle = '#ffe94a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-2, 10); ctx.lineTo(-7, 20); ctx.lineTo(1, 20); ctx.lineTo(-4, 32); ctx.stroke(); }
  ctx.fillStyle = '#5a5070';
  ([[-12, 2, 10], [0, -5, 13], [12, 2, 10], [0, 6, 10]] as const).forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, 0, 3, 0, 7); ctx.arc(5, 0, 3, 0, 7); ctx.fill();
  ctx.fillStyle = '#1b1030'; ctx.beginPath(); ctx.arc(-6, 1, 1.6, 0, 7); ctx.arc(4, 1, 1.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#1b1030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(-3, -2); ctx.moveTo(9, -4); ctx.lineTo(3, -2); ctx.stroke();
  ctx.restore();
}

// ---------- Colonnes qui poussent vers le bas ----------
function flow(c: Cascade, edge: string, mid: string, streak: string, top: string): void {
  const t = G.t;
  const g = ctx.createLinearGradient(c.x, 0, c.x + c.w, 0);
  g.addColorStop(0, edge); g.addColorStop(0.5, mid); g.addColorStop(1, edge);
  ctx.fillStyle = g; ctx.fillRect(c.x, 18, c.w, GROUND - 18);
  ctx.fillStyle = streak;
  for (let k = 0; k < 6; k++) { const x = c.x + 3 + k * 7, off = (t * 420 + k * 57) % 80; for (let y = -80 + off; y < GROUND; y += 80) ctx.fillRect(x, y, 2, 28); }
  ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(c.x + c.w / 2, 10, c.w * 0.9, 18, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(30,30,60,0.35)';
  for (let y = (t * 120) % 90 + 60; y < GROUND - 20; y += 90) { ctx.beginPath(); ctx.moveTo(c.x + c.w / 2 - 8, y); ctx.lineTo(c.x + c.w / 2 + 8, y); ctx.lineTo(c.x + c.w / 2, y + 10); ctx.fill(); }
}

export function drawColumn(c: Cascade): void {
  switch (theme().column) {
    case 'irrigation': flow(c, 'rgba(120,200,180,0.25)', 'rgba(170,240,220,0.7)', 'rgba(255,255,255,0.6)', '#6a4a2a'); break;
    case 'smoke': flow(c, 'rgba(160,120,170,0.15)', 'rgba(220,200,230,0.55)', 'rgba(255,240,255,0.5)', '#a8823a'); break;
    case 'avalanche': flow(c, 'rgba(220,235,255,0.35)', 'rgba(255,255,255,0.85)', 'rgba(170,200,230,0.8)', '#8090b8'); break;
    case 'wind': flow(c, 'rgba(255,230,160,0.15)', 'rgba(255,245,200,0.55)', 'rgba(255,215,90,0.7)', '#ffffff'); break;
    default: return;
  }
}

// ---------- Barres mortelles ----------
const sag = (b: Bridge, u: number) => b.y + Math.sin(Math.PI * u) * 14;

export function drawBar(b: Bridge): void {
  const kind = theme().bar, t = G.t;
  ctx.save(); ctx.translate(0, b.fall); if (b.broken) ctx.globalAlpha = Math.max(0, 1 - b.fall / 300);
  if (kind === 'lightning') {
    ctx.fillStyle = '#5a5070';
    for (const ex of [b.x - 4, b.x + b.len + 4]) { ctx.beginPath(); ctx.arc(ex - 6, b.y - 4, 9, 0, 7); ctx.arc(ex + 6, b.y - 4, 9, 0, 7); ctx.arc(ex, b.y - 10, 10, 0, 7); ctx.fill(); }
    ctx.strokeStyle = Math.sin(t * 30) > 0 ? '#fff6a0' : '#ffd24a'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const u = i / 12; ctx.lineTo(b.x + u * b.len, sag(b, u) + (i % 2 ? -6 : 6) * (i > 0 && i < 12 ? 1 : 0)); }
    ctx.stroke(); ctx.restore(); return;
  }
  const post = kind === 'icicles' ? '#8090b8' : kind === 'garland' ? '#8a1418' : '#6a3e1a';
  ctx.fillStyle = post; ctx.fillRect(b.x - 6, b.y - 26, 6, 40); ctx.fillRect(b.x + b.len, b.y - 26, 6, 40);
  ctx.strokeStyle = kind === 'icicles' ? '#e8f6ff' : '#d9b25a'; ctx.lineWidth = kind === 'icicles' ? 5 : 2; ctx.beginPath();
  for (let i = 0; i <= 16; i++) { const u = i / 16; ctx.lineTo(b.x + u * b.len, sag(b, u) - (kind === 'icicles' ? 4 : 0)); }
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const u = (i + 0.5) / 8, px = b.x + u * b.len, py = sag(b, u);
    if (kind === 'garland') {
      ctx.fillStyle = 'rgba(255,200,100,0.3)'; ctx.beginPath(); ctx.arc(px, py + 4, 8, 0, 7); ctx.fill();
      ctx.fillStyle = i % 2 ? '#ff4a3a' : '#e8343a'; ctx.beginPath(); ctx.ellipse(px, py + 4, 5, 6.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffcf4a'; ctx.fillRect(px - 3, py - 3, 6, 2);
    } else if (kind === 'icicles') {
      ctx.fillStyle = '#d8eeff'; ctx.beginPath(); ctx.moveTo(px - 5, py - 4); ctx.lineTo(px, py + 12 + (i % 3) * 3); ctx.lineTo(px + 5, py - 4); ctx.fill();
    } else {
      // épouvantails miniatures : chapeau de paille et tunique
      ctx.fillStyle = '#4a6a9a'; ctx.fillRect(px - 4, py, 8, 7);
      ctx.fillStyle = '#f2d0a0'; ctx.beginPath(); ctx.arc(px, py - 1, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8c870'; ctx.beginPath(); ctx.moveTo(px - 7, py - 2); ctx.lineTo(px + 7, py - 2); ctx.lineTo(px, py - 8); ctx.fill();
      ctx.save(); ctx.translate(px, py + 3); ctx.rotate(Math.sin(t * 3 + i) * 0.2); ctx.fillStyle = '#d9b25a'; ctx.fillRect(-7, -1, 14, 2); ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- Décor lointain ----------
export function drawFarLayer(): void {
  const kind = theme().far;
  const W = view.W, span = W + 200, off = (G.distTot * 0.35) % span, t = G.t;
  if (kind === 'terraces') {
    for (let i = 0; i < 6; i++) {
      const y = GROUND - 130 + i * 22, sh = (G.distTot * (0.2 + i * 0.04)) % 120;
      ctx.fillStyle = i % 2 ? 'rgba(90,160,90,0.55)' : 'rgba(120,190,110,0.55)';
      ctx.beginPath(); ctx.moveTo(0, GROUND);
      for (let x = -sh; x <= W + 120; x += 60) ctx.quadraticCurveTo(x + 30, y - 10, x + 60, y);
      ctx.lineTo(W, GROUND); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,150,0.35)'; ctx.fillRect(0, y + 3, W, 2);
    }
    return;
  }
  for (const b of scenery.farBamboo) {
    let x = b.x - off; if (x < -40) x += span;
    if (b.c > 0.55) continue; // moins dense que la forêt de bambous
    if (kind === 'roofs') {
      const h = b.h * 0.45, bw = 26 + b.w * 4;
      ctx.fillStyle = 'rgba(70,30,40,0.55)'; ctx.fillRect(x, GROUND - h, bw, h);
      ctx.beginPath(); ctx.moveTo(x - 10, GROUND - h + 4); ctx.quadraticCurveTo(x + bw / 2, GROUND - h - 18, x + bw + 10, GROUND - h + 4); ctx.lineTo(x + bw, GROUND - h - 4); ctx.lineTo(x, GROUND - h - 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,100,0.75)'; ctx.fillRect(x + bw / 2 - 3, GROUND - h + 14, 6, 8);
    } else if (kind === 'pines') {
      const h = b.h * 0.5;
      ctx.fillStyle = 'rgba(40,80,80,0.6)'; ctx.beginPath(); ctx.moveTo(x, GROUND - h); ctx.lineTo(x - 18, GROUND); ctx.lineTo(x + 18, GROUND); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(x, GROUND - h); ctx.lineTo(x - 7, GROUND - h + 20); ctx.lineTo(x + 7, GROUND - h + 20); ctx.fill();
    } else if (kind === 'clouds') {
      const y = GROUND - b.h * 0.3 + Math.sin(t + b.c * 9) * 4;
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x, y, 22 + b.w * 2, 0, 7); ctx.arc(x + 24, y + 6, 18, 0, 7); ctx.fill();
    }
  }
  if (kind === 'clouds') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let x = -((G.distTot * 0.6) % 70); x < W + 70; x += 70) { ctx.beginPath(); ctx.arc(x, GROUND - 4, 30, 0, 7); ctx.fill(); } }
}

