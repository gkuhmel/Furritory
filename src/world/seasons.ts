// Saisons : palettes et fondu des couleurs.
import { SEASON_EVERY } from '../config';
import { G } from '../state';
import { hex, type RGB } from '../util';
import { banner } from './fx';

export type AmbKind = 'petal' | 'firefly' | 'maple' | 'snow' | 'sparkle';
export interface Palette { sky: RGB[]; mtn: RGB[]; bam: RGB[]; ground: RGB; gd: RGB; river: RGB; sun: RGB; snow: number }
export interface Season extends Palette { name: string; p: AmbKind }

const RAW = [
  { name: '🌸 Printemps', p: 'petal', sky: ['#ff9a76', '#ffc4a0', '#c6e7c3', '#5fb59a'], mtn: ['#785a96', '#467878', '#285f55'], bam: ['#3f9a3a', '#8fdc5c', '#56b544', '#2a6b2a'], ground: '#3e8f5e', gd: '#2f7550', river: '#64c1d9', sun: '#fff0c8', snow: 0 },
  { name: '🌙 Soir d’été', p: 'firefly', sky: ['#2b2d6e', '#7a4fa0', '#ff8a5c', '#2f6b5a'], mtn: ['#4a3a7a', '#2f4f6a', '#1f4a40'], bam: ['#2f8a3a', '#7cd05a', '#48a844', '#1f5a2a'], ground: '#2f7a4e', gd: '#24603e', river: '#4a8ac0', sun: '#fff6d8', snow: 0 },
  { name: '🍁 Automne', p: 'maple', sky: ['#ff9a4a', '#ffd59a', '#f5c07a', '#b5652c'], mtn: ['#a0505a', '#8a4a30', '#5e3020'], bam: ['#8a8a2a', '#e0d060', '#b0a040', '#6a5a1a'], ground: '#a0602c', gd: '#7a4420', river: '#5aa0b0', sun: '#fff0c0', snow: 0 },
  { name: '❄️ Hiver', p: 'snow', sky: ['#8fb0e8', '#c8dcff', '#eef4ff', '#c8d8e8'], mtn: ['#8090b8', '#6a7a9a', '#4a5a7a'], bam: ['#3a7a6a', '#8ac8b0', '#5aa090', '#2a5a50'], ground: '#e8f0ff', gd: '#c0d0e8', river: '#a8d8f0', sun: '#ffffff', snow: 1 },
  // palette réservée au Palais céleste (monde 5)
  { name: '✨ Palais céleste', p: 'sparkle', sky: ['#8a6fd0', '#c9a8f0', '#ffe2b8', '#fff4dc'], mtn: ['#e8dcff', '#d8c8f8', '#c8b4f0'], bam: ['#2f9a7a', '#8fe8c0', '#4fc49a', '#1f6a52'], ground: '#ffffff', gd: '#efe6ff', river: '#ffe7a8', sun: '#fff6d0', snow: 0 },
] as const;

export const SEASONS: Season[] = RAW.map(s => ({
  name: s.name, p: s.p, snow: s.snow,
  sky: s.sky.map(hex), mtn: s.mtn.map(hex), bam: s.bam.map(hex),
  ground: hex(s.ground), gd: hex(s.gd), river: hex(s.river), sun: hex(s.sun),
}));

const clonePal = (s: Palette): Palette => ({
  sky: s.sky.map(c => [...c] as RGB), mtn: s.mtn.map(c => [...c] as RGB), bam: s.bam.map(c => [...c] as RGB),
  ground: [...s.ground] as RGB, gd: [...s.gd] as RGB, river: [...s.river] as RGB, sun: [...s.sun] as RGB, snow: s.snow,
});

// Palette courante, qui glisse vers celle de la saison en cours.
export const pal: Palette = clonePal(SEASONS[0]);

export function lerpPal(k: number): void {
  const T = SEASONS[G.curSeason];
  const L = (a: RGB, b: RGB) => { for (let i = 0; i < 3; i++) a[i] += (b[i] - a[i]) * k; };
  for (const key of ['sky', 'mtn', 'bam'] as const) pal[key].forEach((c, i) => L(c, T[key][i]));
  for (const key of ['ground', 'gd', 'river', 'sun'] as const) L(pal[key], T[key]);
  pal.snow += (T.snow - pal.snow) * k;
}

// Passage à la saison suivante tous les SEASON_EVERY points.
export function updateSeason(): void {
  if (G.mode !== 'endless') return;
  const si = Math.floor(G.score / SEASON_EVERY);
  if (si > G.seasonIdx) {
    G.seasonIdx = si; G.curSeason = si % 4; G.stats.season = si;
    banner(SEASONS[G.curSeason].name, '#fff', 34);
  }
}

// Palette posée d'un coup (début de niveau), sans fondu.
export function snapPal(idx: number): void {
  G.curSeason = idx;
  const T = SEASONS[idx];
  for (const key of ['sky', 'mtn', 'bam'] as const) pal[key].forEach((c, i) => { c[0] = T[key][i][0]; c[1] = T[key][i][1]; c[2] = T[key][i][2]; });
  for (const key of ['ground', 'gd', 'river', 'sun'] as const) { pal[key][0] = T[key][0]; pal[key][1] = T[key][1]; pal[key][2] = T[key][2]; }
  pal.snow = T.snow;
}
