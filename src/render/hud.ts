// Interface en jeu dessinée sur le canvas : score, bao, jauge du dragon, bonus actifs, combo, bannières.
import * as C from '../config';
import { G, view } from '../state';
import { mult } from '../meta/missions';
import { ctx } from './canvas';

export function txt(s: string | number, x: number, y: number, size: number, col = '#fff', align: CanvasTextAlign = 'center', stroke = '#3a1530'): void {
  const str = String(s);
  ctx.font = `900 ${size}px "Trebuchet MS",system-ui,sans-serif`; ctx.textAlign = align; ctx.lineJoin = 'round';
  ctx.lineWidth = size / 5; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); ctx.fillStyle = col; ctx.fillText(str, x, y);
}

export function drawHud(): void {
  const W = view.W;
  txt(G.score, W / 2, 70, 52);
  txt('🥟 ' + G.coins, 16, 34, 20, '#fff4d6', 'left');
  // jauge du dragon
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(16, 44, 110, 12);
  const gg = G.dragonT > 0 ? G.dragonT / C.DRAGON_TIME : G.gauge / C.DRAGON_NEED;
  const grd = ctx.createLinearGradient(16, 0, 126, 0); grd.addColorStop(0, '#e8343a'); grd.addColorStop(1, '#ffcf4a');
  ctx.fillStyle = grd; ctx.fillRect(16, 44, 110 * gg, 12); txt('🐉', 134, 56, 14, '#fff', 'left');
  // barres des bonus et événements actifs
  let y = 66; const bars: [string, number, string][] = [];
  if (G.dashT > 0) bars.push(['Nuage', G.dashT / C.DASH_TIME, '#7df9ff']);
  if (G.slowmo > 0) bars.push(['Ralenti', G.slowmo / C.PEACH_SLOW_TIME, '#ffb3c8']);
  if (G.magnetT > 0) bars.push(['Aimant', G.magnetT / C.MAGNET_TIME, '#ffd27a']);
  if (G.shield) bars.push(['Bouclier', 1, '#ffcf4a']);
  if (G.evt) bars.push([G.evt.k === 'wind' ? 'Vent' : G.evt.k === 'fog' ? 'Brume' : 'Fête', G.evt.t / C.EVENT_TIME, '#e8f6ff']);
  for (const [n, v, c] of bars) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(16, y, 90, 9); ctx.fillStyle = c; ctx.fillRect(16, y, 90 * v, 9); txt(n, 112, y + 9, 11, c, 'left'); y += 16; }
  if (G.combo > 1) txt('COMBO ×' + G.combo, W - 16, 34, 20, '#7df9ff', 'right');
  if (mult() > 1) txt('bao ×' + mult(), W - 16, G.combo > 1 ? 58 : 34, 14, '#ffcf4a', 'right');
  G.banners.forEach((b, i) => { ctx.globalAlpha = Math.min(1, b.l * 1.5); txt(b.txt, W / 2, 150 + i * 40, b.size, b.col); ctx.globalAlpha = 1; });
}
