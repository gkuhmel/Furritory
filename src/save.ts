// Sauvegarde versionnée dans localStorage (chaque accès protégé par try/catch).
import { SAVE_KEY, SAVE_VERSION } from './config';

export type Category = 'hat' | 'scarf' | 'glasses' | 'wings' | 'trail';
export type Equipment = Record<Category, string>;
export interface Mission { k: string; goal: number; done: boolean }

export interface SaveData {
  v: number;
  best: number;
  bao: number;
  owned: string[];
  eq: Equipment;
  done: number;
  missions: Mission[] | null;
  ghost: number[] | null;
  sound: boolean;
  levels: number[]; // étoiles obtenues par niveau de l'aventure (0 = pas réussi)
}

const DEF: SaveData = {
  v: SAVE_VERSION,
  best: 0,
  bao: 0,
  owned: ['hat:none', 'scarf:gold', 'glasses:none', 'wings:leaf', 'trail:none'],
  eq: { hat: 'none', scarf: 'gold', glasses: 'none', wings: 'leaf', trail: 'none' },
  done: 0,
  missions: null,
  ghost: null,
  sound: true,
  levels: [],
};

const fresh = (): SaveData => JSON.parse(JSON.stringify(DEF));

// Migration des anciennes sauvegardes vers la version courante.
// v0 : sauvegarde du prototype, sans champ « v » ; même format que la v1.
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const v = typeof raw.v === 'number' ? raw.v : 0;
  if (v < 1) raw.v = 1;
  // v2 : aventure (étoiles par niveau)
  if (v < 2) { raw.levels = []; raw.v = 2; }
  // Ajouter ici les migrations futures : if (v < 3) { … raw.v = 3 }
  return raw;
}

function load(): SaveData {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (!raw || typeof raw !== 'object') raw = {};
  } catch {
    raw = {};
  }
  const s: SaveData = Object.assign(fresh(), migrate(raw));
  s.eq = Object.assign({}, DEF.eq, s.eq || {});
  if (!Array.isArray(s.owned)) s.owned = fresh().owned;
  if (!Array.isArray(s.levels)) s.levels = [];
  s.v = SAVE_VERSION;
  return s;
}

export const S: SaveData = load();

export function saveS(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch {
    /* stockage indisponible (navigation privée…) : on ignore */
  }
}
