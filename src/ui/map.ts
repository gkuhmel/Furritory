// Carte de l'aventure : 5 mondes de 10 niveaux sur un chemin qui monte, façon carte de progression.
import * as C from '../config';
import { S } from '../save';
import { G, reset } from '../state';
import { $ } from '../util';
import { THEMES } from '../world/themes';
import { currentLevel, isUnlocked, levelIndex, starsOf, totalStars } from '../world/level';
import { drawPanda } from '../render/panda';
import { playLevel, showScreen } from './screens';

const STEP = 92; // écart vertical entre deux niveaux
const HEAD = 120; // place du titre du monde
const SEC_H = HEAD + C.LEVELS_PER_WORLD * STEP + 30;
const DECO = ['🎋', '🌾', '🏮', '🏔️', '☁️'];

const nodeX = (w: number, l: number): number => 50 + Math.sin(l * 0.95 + w * 1.7) * 28; // en %
const nodeY = (l: number): number => SEC_H - 60 - l * STEP; // en px depuis le haut de la section

let choco: HTMLCanvasElement | null = null;

function build(): void {
  const inner = $('mapInner');
  inner.innerHTML = '';
  const cur = currentLevel();
  for (let w = C.WORLDS - 1; w >= 0; w--) {
    const th = THEMES[w];
    const sec = document.createElement('div');
    sec.className = 'world';
    sec.style.height = SEC_H + 'px';
    sec.style.background = `linear-gradient(to top, ${th.map[0]}, ${th.map[1]})`;
    // chemin pointillé entre les niveaux (et vers le monde suivant)
    const pts: string[] = [];
    for (let l = -1; l <= C.LEVELS_PER_WORLD; l++) pts.push(`${nodeX(w, l)},${nodeY(l)}`);
    sec.innerHTML = `<svg viewBox="0 0 100 ${SEC_H}" preserveAspectRatio="none"><polyline points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,.75)" stroke-dasharray="10 12" vector-effect="non-scaling-stroke" style="stroke-width:7px"/></svg>`;
    let got = 0;
    for (let l = 0; l < C.LEVELS_PER_WORLD; l++) got += starsOf(w, l);
    const locked = !isUnlocked(levelIndex(w, 0));
    sec.insertAdjacentHTML('beforeend', `<div class="whead">${locked ? '🔒 ' : ''}Monde ${w + 1} · ${th.name}<small>⭐ ${got} / ${C.LEVELS_PER_WORLD * 3}</small></div>`);
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 4 + (i * 7) % 12 : 80 + (i * 5) % 12;
      sec.insertAdjacentHTML('beforeend', `<span class="deco" style="left:${side}%;top:${HEAD + 40 + i * 140}px">${DECO[w]}</span>`);
    }
    for (let l = 0; l < C.LEVELS_PER_WORLD; l++) {
      const idx = levelIndex(w, l), st = starsOf(w, l), open = isUnlocked(idx);
      const b = document.createElement('button');
      b.className = 'node' + (open ? '' : ' locked') + (idx === cur ? ' cur' : '');
      b.style.left = nodeX(w, l) + '%'; b.style.top = nodeY(l) + 'px';
      b.style.background = th.node;
      b.textContent = open ? String(l + 1) : '🔒';
      b.dataset.w = String(w); b.dataset.l = String(l);
      sec.appendChild(b);
      if (st) sec.insertAdjacentHTML('beforeend', `<div class="nstars" style="left:${nodeX(w, l)}%;top:${nodeY(l) + 30}px">${'⭐'.repeat(st)}${'<span style="opacity:.35">⭐</span>'.repeat(3 - st)}</div>`);
      if (idx === cur) {
        choco = document.createElement('canvas'); choco.id = 'mapChoco';
        choco.style.left = nodeX(w, l) + '%'; choco.style.top = nodeY(l) + 'px';
        sec.appendChild(choco);
      }
    }
    inner.appendChild(sec);
  }
}

export function openMap(): void {
  G.state = 'map'; reset();
  $('mapStars').textContent = String(totalStars()); $('mapBao').textContent = String(S.bao);
  build();
  showScreen('map');
  // centre la carte sur le niveau en cours
  const cur = currentLevel(), w = Math.floor(cur / C.LEVELS_PER_WORLD), l = cur % C.LEVELS_PER_WORLD;
  const y = (C.WORLDS - 1 - w) * SEC_H + nodeY(l);
  const sc = $('mapScroll');
  sc.scrollTop = y - sc.clientHeight * 0.55;
}

// Choco qui plane au-dessus du niveau en cours.
export function drawMapChoco(): void {
  if (!choco) return;
  const d = Math.min(devicePixelRatio || 1, C.DPR_MAX), w = 84, h = 66;
  if (choco.width !== w * d) { choco.width = w * d; choco.height = h * d; }
  const c = choco.getContext('2d')!;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
  c.save(); c.translate(44, 36 + Math.sin(G.t * 3) * 4); c.scale(1.35, 1.35);
  drawPanda(c, S.eq, { wing: (Math.sin(G.t * 9) + 1) / 2, rot: Math.sin(G.t * 3) * 0.08 }); c.restore();
}

export function initMap(): void {
  $('mapInner').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.node');
    if (!b || b.classList.contains('locked')) return;
    playLevel(Number(b.dataset.w), Number(b.dataset.l));
  });
}
