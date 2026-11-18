// Interface en jeu dessinée sur le canvas : pastilles, jauge du dragon, bonus actifs, combo, bannières, progression.
import * as C from '../config';
import { G, view } from '../state';
import { mult } from '../meta/missions';
import { ctx } from './canvas';

const FONT = '"Baloo 2","Trebuchet MS",system-ui,sans-serif';

export function txt(s: string | number, x: number, y: number, size: number, col = '#fff', align: CanvasTextAlign = 'center', stroke = '#3a1530'): void {
  const str = String(s);
  ctx.font = `800 ${size}px ${FONT}`; ctx.textAlign = align; ctx.lineJoin = 'round';
  ctx.lineWidth = size / 4.5; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); ctx.fillStyle = col; ctx.fillText(str, x, y);
}

// Rectangle arrondi (chemin seulement).
function rr(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Pastille sombre bordée d'or.
function pill(x: number, y: number, w: number, h: number): void {
  rr(x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(40,12,36,0.62)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,203,61,0.85)'; ctx.lineWidth = 2; ctx.stroke();
}

// Jauge arrondie (fond, remplissage dégradé, reflet, bord).
function gauge(x: number, y: number, w: number, h: number, k: number, c1: string, c2: string): void {
  rr(x, y, w, h, h / 2); ctx.fillStyle = 'rgba(30,8,28,0.55)'; ctx.fill();
  if (k > 0) {
    ctx.save(); rr(x, y, w, h, h / 2); ctx.clip();
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(x, y, w * Math.min(1, k), h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y + 1, w * Math.min(1, k), h * 0.35);
    ctx.restore();
  }
  rr(x, y, w, h, h / 2); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
}

// Petit bao pour la pastille.
function baoIcon(x: number, y: number): void {
  ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.ellipse(x, y + 1, 9, 7, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c8a878'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x - 4, y + 2); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y + 2); ctx.stroke();
}

export function drawHud(): void {
  const W = view.W;
  if (G.mode === 'level') drawLevelHud(W); else txt(G.score, W / 2, 74, 56, '#fff', 'center', '#3a1530');
  // bao
  pill(10, 12, 78, 28); baoIcon(28, 26); txt(G.coins, 44, 35, 20, '#fff4d6', 'left');
  // jauge du dragon
  const gg = G.dragonT > 0 ? G.dragonT / C.DRAGON_TIME : G.gauge / C.DRAGON_NEED;
  gauge(12, 48, 104, 13, gg, '#e8343a', '#ffcf4a');
  txt('🐉', 128, 61, 15, '#fff', 'center', 'rgba(0,0,0,0)');
  // barres des bonus et événements actifs
  let y = 70; const bars: [string, number, string][] = [];
  if (G.dashT > 0) bars.push(['Nuage', G.dashT / C.DASH_TIME, '#7df9ff']);
  if (G.slowmo > 0) bars.push(['Ralenti', G.slowmo / C.PEACH_SLOW_TIME, '#ffb3c8']);
  if (G.magnetT > 0) bars.push(['Aimant', G.magnetT / C.MAGNET_TIME, '#ffd27a']);
  if (G.shield) bars.push(['Bouclier', 1, '#ffcf4a']);
  if (G.evt) bars.push([G.evt.k === 'wind' ? 'Vent' : G.evt.k === 'fog' ? 'Brume' : 'Fête', G.evt.t / C.EVENT_TIME, '#e8f6ff']);
  for (const [n, v, c] of bars) { gauge(12, y, 80, 9, v, c, '#ffffff'); txt(n, 98, y + 9, 12, c, 'left'); y += 16; }
  if (G.combo > 1) txt('COMBO ×' + G.combo, W - 14, 36, 22, '#7df9ff', 'right');
  if (mult() > 1) txt('bao ×' + mult(), W - 14, G.combo > 1 ? 58 : 36, 14, '#ffcf4a', 'right');
  G.banners.forEach((b, i) => { ctx.globalAlpha = Math.min(1, b.l * 1.5); txt(b.txt, W / 2, 150 + i * 40, b.size, b.col); ctx.globalAlpha = 1; });
}

// Aventure : barre de progression vers l'arrivée et lettres CHOCO, dans la bande du sol (rien n'y gêne le jeu).
function drawLevelHud(W: number): void {
  const d = G.def!, bw = Math.min(200, W * 0.58), x = W / 2 - bw / 2 - 8, y = C.GROUND + 8;
  const k = Math.min(1, G.passed / d.pairs);
  gauge(x, y, bw, 11, k, '#7fe36a', '#d8ff7a');
  // repère de Choco sur la barre
  ctx.fillStyle = '#e8661e'; ctx.beginPath(); ctx.arc(x + bw * k, y + 5.5, 7, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + bw * k + 2, y + 6.5, 2.4, 0, 7); ctx.fill();
  txt('🏁', x + bw + 14, y + 12, 15, '#fff', 'center', 'rgba(0,0,0,0)');
  C.LETTERS.forEach((L, i) => {
    const lx = W / 2 + (i - 2) * 27, ly = C.H - 18, got = G.letters[i];
    ctx.beginPath(); ctx.arc(lx, ly, 12, 0, 7);
    if (got) {
      const g = ctx.createRadialGradient(lx - 4, ly - 4, 1, lx, ly, 12); g.addColorStop(0, '#fff6b8'); g.addColorStop(0.6, '#ffcb3d'); g.addColorStop(1, '#f39a1a');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#a75f08'; ctx.lineWidth = 2; ctx.stroke();
    } else { ctx.fillStyle = 'rgba(30,8,28,0.45)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    txt(L, lx, ly + 6, 17, got ? '#6a2c08' : 'rgba(255,255,255,0.55)', 'center', got ? '#fff6d0' : 'rgba(0,0,0,0)');
  });
}
