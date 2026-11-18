// Bonus : bao, lanterne, nuage-éclair, pêche.
import { LETTERS } from '../config';
import { G } from '../state';
import { ctx } from './canvas';

export function drawItems(): void {
  for (const it of G.items) {
    const bob = it.thrown ? 0 : Math.sin(it.ph) * 4; ctx.save(); ctx.translate(it.x, it.y + bob);
    if (it.type === 'bao') {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.ellipse(0, 2, 14, 11, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(90,50,20,0.55)'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-5, -2, 4, 2.5, -0.4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#e0c9a8'; ctx.lineWidth = 1.5;
      for (let a = -0.9; a <= 0.9; a += 0.45) { ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(Math.sin(a) * 10, 2); ctx.stroke(); }
      ctx.fillStyle = '#e0c9a8'; ctx.beginPath(); ctx.arc(0, -7, 2.5, 0, 7); ctx.fill();
    } else if (it.type === 'lantern') {
      ctx.fillStyle = 'rgba(255,207,74,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 28 + Math.sin(it.ph * 2) * 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8343a'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 17, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(80,10,10,0.6)'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#ffcf4a'; ctx.fillRect(-8, -19, 16, 4); ctx.fillRect(-8, 15, 16, 4); ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('福', 0, 5);
    } else if (it.type === 'cloud') {
      ctx.fillStyle = 'rgba(125,249,255,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 30 + Math.sin(it.ph * 2) * 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ([[-10, 2, 10], [0, -4, 12], [11, 2, 10], [0, 6, 9]] as const).forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
      ctx.strokeStyle = '#38c8e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6, 0.5, 5.5); ctx.stroke();
    } else if (it.type === 'letter') {
      // lettre CHOCO : médaille dorée qui scintille
      const s = 1 + Math.sin(it.ph * 2) * 0.06; ctx.scale(s, s);
      ctx.fillStyle = 'rgba(255,215,90,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill();
      ctx.strokeStyle = '#c8901a'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#6a3a1a'; ctx.font = '800 21px "Baloo 2","Trebuchet MS",system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(LETTERS[it.idx ?? 0], 0, 1.5); ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#fff'; ctx.save(); ctx.rotate(it.ph); ctx.fillRect(-1, -22, 2, 6); ctx.restore();
    } else if (it.type === 'peach') {
      ctx.fillStyle = 'rgba(255,154,176,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 28 + Math.sin(it.ph * 2) * 3, 0, 7); ctx.fill();
      const g = ctx.createRadialGradient(-4, -4, 2, 0, 0, 16); g.addColorStop(0, '#ffe3b0'); g.addColorStop(1, '#ff6f8f');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -14); ctx.bezierCurveTo(16, -14, 16, 12, 0, 15); ctx.bezierCurveTo(-16, 12, -16, -14, 0, -14); ctx.fill(); ctx.strokeStyle = 'rgba(120,30,50,0.55)'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#4fbf4a'; ctx.beginPath(); ctx.ellipse(6, -14, 7, 3, -0.5, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
}
