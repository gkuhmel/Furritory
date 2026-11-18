// Carte de l'aventure : 5 mondes de 10 niveaux sur un chemin qui monte.
// Chaque monde est un paysage peint sur un canvas ; les niveaux sont des médaillons HTML posés dessus.
import * as C from '../config';
import { S } from '../save';
import { G, reset } from '../state';
import { $ } from '../util';
import { THEMES } from '../world/themes';
import { currentLevel, isUnlocked, levelIndex, starsOf, totalStars } from '../world/level';
import { drawPanda } from '../render/panda';
import { paintWorld, type MapPt } from '../render/mapart';
import { playLevel, showScreen } from './screens';
import { showMenu } from './menu';

const STEP = 100; // écart vertical entre deux niveaux
const HEAD = 190; // place de l'enseigne du monde
const SEC_H = HEAD + C.LEVELS_PER_WORLD * STEP + 30;
const NODE_COLORS: [string, string][] = [
  ['#9be86a', '#2f9a3a'], ['#d2a8ff', '#6a3fb0'], ['#ff9a7a', '#c42a22'], ['#aee4ff', '#2f7ac0'], ['#ffe68a', '#c98a10'],
];

const nodeX = (w: number, l: number): number => 50 + Math.sin(l * 0.95 + w * 1.7) * 27; // en % de la largeur
const nodeY = (l: number): number => SEC_H - 70 - l * STEP; // en px depuis le haut du monde

let choco: HTMLCanvasElement | null = null;

function build(): void {
  const inner = $('mapInner');
  inner.innerHTML = '';
  choco = null;
  const cur = currentLevel();
  const width = inner.clientWidth || Math.min(innerWidth, 520);
  const dpr = Math.min(devicePixelRatio || 1, C.DPR_MAX);
  for (let w = C.WORLDS - 1; w >= 0; w--) {
    const th = THEMES[w];
    const sec = document.createElement('div');
    sec.className = 'world';
    sec.style.height = SEC_H + 'px';
    // paysage peint : le chemin passe aussi par le dernier niveau du monde d'en dessous et le premier du monde d'au-dessus
    const pts: MapPt[] = [];
    for (let l = -1; l <= C.LEVELS_PER_WORLD; l++) pts.push({ x: width * nodeX(w, l) / 100, y: nodeY(l) });
    const cv = document.createElement('canvas');
    cv.width = Math.round(width * dpr); cv.height = Math.round(SEC_H * dpr);
    const c = cv.getContext('2d')!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintWorld(c, w, width, SEC_H, pts, w === 0, w === C.WORLDS - 1);
    sec.appendChild(cv);
    // enseigne du monde
    let got = 0;
    for (let l = 0; l < C.LEVELS_PER_WORLD; l++) got += starsOf(w, l);
    const locked = !isUnlocked(levelIndex(w, 0));
    sec.insertAdjacentHTML('beforeend',
      `<div class="wsign${locked ? ' locked' : ''}" style="top:${HEAD * 0.32}px"><div class="ribbon ${w % 2 ? 'gold' : 'red'}"><small>MONDE ${w + 1}</small>${locked ? '🔒 ' : ''}${th.name}</div><br><span class="wst">⭐ ${got} / ${C.LEVELS_PER_WORLD * 3}</span></div>`);
    // médaillons des niveaux
    const [c1, c2] = NODE_COLORS[w];
    for (let l = 0; l < C.LEVELS_PER_WORLD; l++) {
      const idx = levelIndex(w, l), st = starsOf(w, l), open = isUnlocked(idx);
      const b = document.createElement('button');
      b.className = 'node' + (open ? '' : ' locked') + (idx === cur ? ' cur' : '');
      b.style.left = nodeX(w, l) + '%'; b.style.top = nodeY(l) + 'px';
      if (open) { b.style.setProperty('--c1', c1); b.style.setProperty('--c2', c2); }
      b.textContent = open ? String(l + 1) : '🔒';
      b.dataset.w = String(w); b.dataset.l = String(l);
      sec.appendChild(b);
      if (st) {
        const stars = [0, 1, 2].map(i => `<i class="${i < st ? '' : 'off'}">⭐</i>`).join('');
        sec.insertAdjacentHTML('beforeend', `<div class="nstars" style="left:${nodeX(w, l)}%;top:${nodeY(l) - 66}px">${stars}</div>`);
      }
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
  showScreen('map');
  build();
  // centre la carte sur le niveau en cours
  const cur = currentLevel(), w = Math.floor(cur / C.LEVELS_PER_WORLD), l = cur % C.LEVELS_PER_WORLD;
  const y = (C.WORLDS - 1 - w) * SEC_H + nodeY(l);
  const sc = $('mapScroll');
  sc.scrollTop = y - sc.clientHeight * 0.6;
}

// Choco qui plane au-dessus du niveau en cours.
export function drawMapChoco(): void {
  if (!choco) return;
  const d = Math.min(devicePixelRatio || 1, C.DPR_MAX), w = 96, h = 76;
  if (choco.width !== w * d) { choco.width = w * d; choco.height = h * d; }
  const c = choco.getContext('2d')!;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
  // ombre portée
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(48, 72, 18 - Math.sin(G.t * 3) * 3, 3, 0, 0, 7); c.fill();
  c.save(); c.translate(50, 38 + Math.sin(G.t * 3) * 4); c.scale(1.45, 1.45);
  drawPanda(c, S.eq, { wing: (Math.sin(G.t * 9) + 1) / 2, rot: Math.sin(G.t * 3) * 0.08 }); c.restore();
}

export function initMap(): void {
  $('mapInner').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.node');
    if (!b || b.classList.contains('locked')) return;
    playLevel(Number(b.dataset.w), Number(b.dataset.l));
  });
  $('bMapBack').onclick = () => showMenu();
}
