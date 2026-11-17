// Boutique : onglets, grille d'objets, achat et aperçu animé du panda.
import { DPR_MAX } from '../config';
import { S, type Category } from '../save';
import { G, reset, type Particle } from '../state';
import { $ } from '../util';
import { sfx } from '../audio/sfx';
import { SHOP, buy, equip, findItem, isOwned } from '../meta/shop';
import { spawnTrail } from '../world/fx';
import { drawPanda } from '../render/panda';
import { showScreen } from './screens';
import { showMenu } from './menu';

let shopTab: Category = 'hat';
let tryOn: string | null = null;

export function openShop(_from: 'menu' | 'over'): void {
  tryOn = null; G.state = 'shop'; reset();
  showScreen('shop'); renderShop();
}

function renderShop(): void {
  $('sBao').textContent = String(S.bao);
  $('tabs').innerHTML = (Object.keys(SHOP) as Category[]).map(k => `<button data-t="${k}" class="${k === shopTab ? 'on' : ''}">${SHOP[k].n}</button>`).join('');
  $('grid').innerHTML = SHOP[shopTab].items.map(it => {
    const owned = isOwned(shopTab, it.id), eq = S.eq[shopTab] === it.id, sel = tryOn ? tryOn === it.id : eq;
    return `<div class="item ${sel ? 'sel' : ''}" data-i="${it.id}">${it.n}<small class="${eq ? 'eq' : owned ? '' : 'lock'}">${eq ? 'Équipé' : owned ? 'Possédé' : it.p + ' 🥟'}</small></div>`;
  }).join('');
  const b = $<HTMLButtonElement>('bBuy');
  const it = tryOn ? findItem(shopTab, tryOn) : undefined;
  if (it) {
    b.classList.remove('hidden');
    b.textContent = S.bao >= it.p ? `Acheter pour ${it.p} 🥟` : `Il manque ${it.p - S.bao} 🥟`;
    b.disabled = S.bao < it.p;
  } else b.classList.add('hidden');
}

export function initShop(): void {
  $('tabs').addEventListener('click', e => {
    const k = (e.target as HTMLElement).dataset.t as Category | undefined;
    if (k) { shopTab = k; tryOn = null; renderShop(); }
  });
  $('grid').addEventListener('click', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.item'); if (!el) return;
    const id = el.dataset.i!;
    if (isOwned(shopTab, id)) { equip(shopTab, id); tryOn = null; sfx.point(); } else tryOn = id;
    renderShop();
  });
  $('bBuy').onclick = () => {
    if (!tryOn || !buy(shopTab, tryOn)) return;
    tryOn = null; sfx.power(); renderShop();
  };
  $('bBack').onclick = () => showMenu();
}

// ---------- Aperçu animé ----------
const pv = $<HTMLCanvasElement>('pv');
const pc = pv.getContext('2d')!;
let pvParts: Particle[] = [];

const previewEq = () => { const eq = { ...S.eq }; if (tryOn) eq[shopTab] = tryOn; return eq; };
const SC = 2.6;

function previewSize(): { w: number; h: number; d: number } {
  const r = pv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, DPR_MAX);
  if (pv.width !== Math.round(r.width * d)) { pv.width = Math.round(r.width * d); pv.height = Math.round(r.height * d); }
  return { w: pv.width / d, h: pv.height / d, d };
}

export function updatePreview(dt: number): void {
  const { w, h } = previewSize();
  const eq = previewEq();
  const cx = w * 0.55, cy = h * 0.52 + Math.sin(G.t * 3) * 5;
  if (eq.trail !== 'none') spawnTrail(pvParts, cx - 16 * SC, cy, eq.trail);
  for (const p of pvParts) { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; }
  pvParts = pvParts.filter(p => p.l > 0 && p.x > -10);
}

export function drawPreview(): void {
  const { w, h, d } = previewSize();
  pc.setTransform(d, 0, 0, d, 0, 0);
  const g = pc.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ff9a76'); g.addColorStop(1, '#c6e7c3'); pc.fillStyle = g; pc.fillRect(0, 0, w, h);
  const eq = previewEq();
  const cx = w * 0.55, cy = h * 0.52 + Math.sin(G.t * 3) * 5;
  for (const p of pvParts) { pc.globalAlpha = Math.max(0, p.l / p.ml) * (p.a ?? 1); pc.fillStyle = p.c; pc.beginPath(); pc.arc(p.x, p.y, p.r * 1.5, 0, 7); pc.fill(); }
  pc.globalAlpha = 1;
  pc.save(); pc.translate(cx, cy); pc.scale(SC, SC); drawPanda(pc, eq, { wing: (Math.sin(G.t * 8) + 1) / 2 }); pc.restore();
}
