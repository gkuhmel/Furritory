// État de la partie (logique uniquement) et remise à zéro.
import * as C from './config';
import type { LevelDef } from './config';
import { rnd } from './util';

export type Screen = 'menu' | 'play' | 'over' | 'win' | 'shop' | 'map';
export type Mode = 'endless' | 'level';
export type ItemType = 'bao' | 'lantern' | 'cloud' | 'peach' | 'letter';
export type EventKind = 'wind' | 'festival' | 'fog';
export type DeathCause = 'bambou' | 'sol' | 'grue' | 'pomme' | 'pont';

export interface Panda { x: number; y: number; vy: number; rot: number; wing: number; alive: boolean }
export interface Pipe { x: number; cy: number; base: number; gap: number; passed: boolean; sway: number; ph: number; freq: number; smashed?: boolean }
export interface Item { type: ItemType; x: number; y: number; r: number; ph: number; vx?: number; vy?: number; thrown?: boolean; got?: boolean; idx?: number }
export interface Particle { x: number; y: number; vx: number; vy: number; l: number; ml: number; c: string; r: number; g: number; a?: number; sh?: 'e' }
export interface Pop { x: number; y: number; txt: string; col: string; size: number; l: number }
export interface Banner { txt: string; col: string; size: number; l: number }
export interface Crane { x: number; y0: number; y: number; ph: number; amp: number; dead?: boolean }
export interface Cascade { x: number; w: number }
export interface Bridge { x: number; y: number; len: number; fall: number; broken: boolean }
export interface Cone { x: number; y: number; vx: number; vy: number; rot: number; dead?: boolean }
export interface Boss { x: number; y: number; phase: 'in' | 'fight' | 'out'; t: number; throwT: number; arm: number; life: number }
export interface GameEvent { k: EventKind; t: number; dir: number }
export interface Stats {
  near: number; bao: number; score: number; maxCombo: number; dragon: number;
  peach: number; season: number; monkey: number; shieldBreak: number; smash: number;
}
export type StatKey = keyof Stats;

function freshRun() {
  return {
    panda: { x: G_view.W * C.PANDA_X, y: C.H * C.PANDA_Y, vy: 0, rot: 0, wing: 0, alive: true } as Panda,
    pipes: [] as Pipe[],
    items: [] as Item[],
    parts: [] as Particle[],
    pops: [] as Pop[],
    banners: [] as Banner[],
    cranes: [] as Crane[],
    cascades: [] as Cascade[],
    bridges: [] as Bridge[],
    cones: [] as Cone[],
    boss: null as Boss | null,
    score: 0,
    coins: 0,
    combo: 0,
    comboT: 0,
    speed: C.SPEED_BASE,
    nextPipe: 0,
    distTot: 0,
    slowmo: 0,
    magnetT: 0,
    dashT: 0,
    shield: false,
    ghostT: 0,
    dragonT: 0,
    gauge: 0,
    nearSlow: 0,
    stats: { near: 0, bao: 0, score: 0, maxCombo: 0, dragon: 0, peach: 0, season: 0, monkey: 0, shieldBreak: 0, smash: 0 } as Stats,
    seasonIdx: 0,
    curSeason: 0,
    nextBoss: C.MONKEY_FIRST,
    forceSide: null as { y: number; above: boolean } | null,
    evt: null as GameEvent | null,
    evtT: rnd(C.EVENT_FIRST_MIN, C.EVENT_FIRST_MAX),
    rainT: 0,
    dragonHist: [] as number[],
    ghostRec: [] as number[],
    ghostDone: false,
    deathCause: null as DeathCause | null,
    newBest: false,
    // aventure
    letters: [false, false, false, false, false],
    pairsSpawned: 0,
    passed: 0, // passages franchis (barre de progression)
    finish: null as { x: number; passed: boolean } | null,
    bossDone: false,
    stars: 0,
  };
}

// Dimensions logiques de l'écran (mises à jour au redimensionnement).
const G_view = { W: 400, dpr: 1 };
export const view = G_view;

// État global : écran courant, horloge, effets d'écran, puis données de la partie.
export const G = {
  state: 'menu' as Screen,
  mode: 'endless' as Mode,
  world: 0, // monde du niveau en cours (0 en mode infini)
  level: 0, // niveau dans le monde
  def: null as LevelDef | null, // réglages du niveau en cours
  t: 0,
  shake: 0,
  flash: 0,
  overT: 0,
  ...freshRun(),
};

export function reset(): void {
  Object.assign(G, freshRun());
}

// Invulnérable (nuage-éclair ou dragon) : casse les obstacles.
export const inv = (): boolean => G.dashT > 0 || G.dragonT > 0;
