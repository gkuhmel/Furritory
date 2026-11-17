// Décor : lanternes, montagnes, pagode, forêt lointaine, particules d'ambiance, sol, vent, brume.
import { GROUND, H } from '../config';
import { G, view } from '../state';
import { css } from '../util';
import { pal } from '../world/seasons';
import { scenery } from '../world/scenery';
import { ctx } from './canvas';

const mA = [0.55, 0.7, 0.9];

export function drawMountains(): void {
  const W = view.W, distTot = G.distTot;
  scenery.mountains.forEach((pts, li) => {
    const span = W + 300, par = (distTot * (0.05 + li * 0.08)) % span, base = GROUND + 20;
    ctx.fillStyle = css(pal.mtn[li], mA[li]);
    for (let rep = 0; rep < 2; rep++) {
      const off = -par + rep * span;
      for (const m of pts) {
        const x = m.x + off, top = base - m.h; if (x < -200 || x > W + 200) continue;
        ctx.beginPath(); ctx.moveTo(x - m.w * 0.6, base);
        ctx.bezierCurveTo(x - m.w * 0.35, top + m.h * 0.2, x - m.w * 0.25, top, x, top);
        ctx.bezierCurveTo(x + m.w * 0.25, top, x + m.w * 0.35, top + m.h * 0.2, x + m.w * 0.6, base); ctx.fill();
        if (pal.snow > 0.05) {
          ctx.fillStyle = `rgba(255,255,255,${0.85 * pal.snow})`; ctx.beginPath(); ctx.moveTo(x - m.w * 0.16, top + m.h * 0.12);
          ctx.quadraticCurveTo(x, top - 4, x + m.w * 0.16, top + m.h * 0.12); ctx.lineTo(x, top + m.h * 0.18); ctx.fill();
          ctx.fillStyle = css(pal.mtn[li], mA[li]);
        }
      }
    }
    if (li === 1) { const s = W + 400; const px = ((W * 0.6 - distTot * 0.13) % s + s) % s - 100; pagoda(px, base - 150); }
  });
  const g = ctx.createLinearGradient(0, GROUND - 120, 0, GROUND); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,240,230,0.45)');
  ctx.fillStyle = g; ctx.fillRect(0, GROUND - 120, W, 120);
}

function pagoda(x: number, y: number): void {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(60,40,70,0.75)';
  for (let i = 0; i < 4; i++) {
    const w = 60 - i * 11, yy = -i * 30; ctx.fillRect(-w * 0.35, yy - 22, w * 0.7, 22);
    ctx.beginPath(); ctx.moveTo(-w, yy - 18); ctx.quadraticCurveTo(0, yy - 36, w, yy - 18); ctx.lineTo(w * 0.7, yy - 26); ctx.quadraticCurveTo(0, yy - 40, -w * 0.7, yy - 26); ctx.fill();
  }
  ctx.fillRect(-2, -150, 4, 30);
  if (G.curSeason === 1) { ctx.fillStyle = 'rgba(255,210,120,0.9)'; for (let i = 0; i < 4; i++) ctx.fillRect(-4, -i * 30 - 16, 8, 6); }
  ctx.restore();
}

export function drawFarBamboo(): void {
  const span = view.W + 200, off = (G.distTot * 0.35) % span;
  for (const b of scenery.farBamboo) {
    let x = b.x - off; if (x < -20) x += span;
    ctx.fillStyle = css(b.c < 0.5 ? pal.bam[0] : pal.bam[2], 0.5); ctx.fillRect(x, GROUND - b.h, b.w, b.h);
    for (let y = GROUND - b.h + 30; y < GROUND; y += 36) ctx.fillRect(x - 1, y, b.w + 2, 2);
  }
}

export function drawLanterns(): void {
  const W = view.W, t = G.t;
  const fest = G.evt && G.evt.k === 'festival';
  for (const l of scenery.lanterns) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.scale(l.s, l.s); ctx.globalAlpha = fest || G.curSeason === 1 ? 1 : 0.75;
    ctx.fillStyle = 'rgba(255,120,60,0.28)'; ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8343a'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 15, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf4a'; ctx.fillRect(-7, -17, 14, 4); ctx.fillRect(-7, 13, 14, 4); ctx.fillStyle = 'rgba(255,220,120,0.8)'; ctx.fillRect(-1, 17, 2, 8); ctx.restore();
  }
  if (fest) {
    for (let i = 0; i < 10; i++) {
      const x = (i * 97 + t * -40) % (W + 40); const xx = x < -20 ? x + W + 40 : x; const y = 60 + ((i * 53) % 280) + Math.sin(t + i) * 6;
      ctx.fillStyle = 'rgba(255,90,60,0.85)'; ctx.beginPath(); ctx.ellipse(xx, y, 7, 9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,100,0.3)'; ctx.beginPath(); ctx.arc(xx, y, 16, 0, 7); ctx.fill();
    }
  }
}

export function drawAmb(): void {
  const t = G.t;
  for (const p of scenery.amb) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
    if (p.k === 'petal') { ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 7); ctx.fill(); }
    else if (p.k === 'firefly') {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + p.ph)); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(255,245,150,0.3)'; ctx.beginPath(); ctx.arc(0, 0, p.r * 4, 0, 7); ctx.fill();
      ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill();
    }
    else if (p.k === 'maple') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; ctx.lineTo(Math.cos(a) * p.r, Math.sin(a) * p.r); ctx.lineTo(Math.cos(a + 0.63) * p.r * 0.45, Math.sin(a + 0.63) * p.r * 0.45); }
      ctx.fill();
    }
    else { ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); }
    ctx.restore();
  }
}

export function leaf(x: number, y: number, dir: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.rotate(-0.4);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -10, 38, 0); ctx.quadraticCurveTo(20, 8, 0, 0); ctx.fill(); ctx.restore();
}

export function drawGround(): void {
  const W = view.W, distTot = G.distTot;
  ctx.fillStyle = css(pal.ground); ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = css(pal.gd); const off = distTot % 40;
  for (let x = -off; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x + 20, GROUND - 10); ctx.lineTo(x + 40, GROUND); ctx.fill(); }
  ctx.fillStyle = css(pal.river); ctx.fillRect(0, GROUND + 30, W, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let x = -(distTot * 1.3 % 60); x < W; x += 60) ctx.fillRect(x, GROUND + 35, 22, 3);
}

export function drawWind(): void {
  const evt = G.evt;
  if (!evt || evt.k !== 'wind') return;
  const W = view.W, t = G.t;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const x = ((i * 83) - t * 500) % (W + 100); const xx = x < -50 ? x + W + 100 : x;
    const y = ((i * 137) + evt.dir * t * 260) % H; const yy = y < 0 ? y + H : y;
    ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 40, yy - evt.dir * 14); ctx.stroke();
  }
}

export function drawFog(): void {
  const evt = G.evt;
  if (!evt || evt.k !== 'fog') return;
  const W = view.W, t = G.t;
  const k = Math.min(1, (7 - evt.t) * 1.5, evt.t * 1.5);
  const g = ctx.createLinearGradient(W * 0.42, 0, W * 0.8, 0); g.addColorStop(0, 'rgba(240,235,255,0)'); g.addColorStop(1, `rgba(240,235,255,${0.92 * k})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(255,255,255,${0.25 * k})`;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse((W * 0.5 + i * 90 - t * 30) % W + W * 0.4, 120 + i * 100, 90, 26, 0, 0, 7); ctx.fill(); }
}
