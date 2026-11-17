// Missions : trois objectifs persistants qui font monter le multiplicateur de bao.
import { MULT_MAX, MULT_STEP } from '../config';
import { S, saveS, type Mission } from '../save';
import { G, type StatKey } from '../state';
import { banner } from '../world/fx';
import { sfx } from '../audio/sfx';

const SEASON_NAMES = ['le printemps', 'le soir d’été', 'l’automne', 'l’hiver', 'le printemps suivant', 'le 2e été'];

interface MissionDef { k: StatKey; t: (n: number) => string; g: (l: number) => number }

export const MISS: MissionDef[] = [
  { k: 'near', t: n => `Frôle ${n} bambous`, g: l => 3 + l },
  { k: 'bao', t: n => `Attrape ${n} bao`, g: l => 6 + l * 2 },
  { k: 'score', t: n => `Fais ${n} points`, g: l => 15 + l * 5 },
  { k: 'maxCombo', t: n => `Fais un combo ×${n}`, g: l => 2 + Math.floor(l / 2) },
  { k: 'dragon', t: n => `Chevauche le dragon ${n} fois`, g: l => 1 + Math.floor(l / 5) },
  { k: 'peach', t: n => `Mange ${n} pêche${n > 1 ? 's' : ''} d’immortalité`, g: l => 1 + Math.floor(l / 5) },
  { k: 'season', t: n => `Atteins ${SEASON_NAMES[n]}`, g: l => Math.min(5, 1 + Math.floor(l / 3)) },
  { k: 'monkey', t: () => `Survis au singe farceur`, g: () => 1 },
  { k: 'shieldBreak', t: n => `Brise ${n} bouclier${n > 1 ? 's' : ''} lanterne`, g: l => 1 + Math.floor(l / 6) },
  { k: 'smash', t: n => `Casse ${n} obstacles (nuage ou dragon)`, g: l => 3 + l },
];

export const mDef = (k: string): MissionDef => MISS.find(d => d.k === k)!;

function newMission(excl: string[]): Mission {
  const pool = MISS.filter(d => !excl.includes(d.k));
  const d = pool[Math.floor(Math.random() * pool.length)];
  return { k: d.k, goal: d.g(S.done), done: false };
}

export function missions(): Mission[] {
  return S.missions ?? [];
}

// Complète à 3 missions et remplace celles déjà réussies.
export function refreshMissions(): void {
  if (!S.missions || S.missions.length !== 3) {
    S.missions = [];
    for (let i = 0; i < 3; i++) S.missions.push(newMission(S.missions.map(m => m.k)));
  }
  const cur = S.missions;
  S.missions = cur.map((m, i) => (m.done ? newMission(cur.filter((_, j) => j !== i).map(x => x.k)) : m));
  saveS();
}

export const mult = (): number => Math.min(MULT_MAX, 1 + MULT_STEP * S.done);

export function missionsHTML(): string {
  return '<div class="t">Missions</div>' + missions().map(m =>
    `<div class="m ${m.done ? 'done' : ''}">${m.done ? '✅' : '⬜️'}<span>${mDef(m.k).t(m.goal)}</span></div>`).join('');
}

// Valide les missions pendant la partie.
export function checkMissions(): void {
  G.stats.score = G.score;
  for (const m of missions()) {
    if (!m.done && G.stats[m.k as StatKey] >= m.goal) {
      m.done = true; S.done++; saveS();
      banner('✅ ' + mDef(m.k).t(m.goal), '#7df9ff', 20); sfx.power();
    }
  }
}
