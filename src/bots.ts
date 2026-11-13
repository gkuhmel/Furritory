import * as THREE from 'three';
import { config } from './config';
import { cellToDir, dirToCell } from './cube-grid';
import type { Player } from './game';
import { SEA, type Territory } from './territory';

const DEG = Math.PI / 180;

type Mode = 'home' | 'loop' | 'return' | 'hunt';

/** État de décision d'un rival. Tous les points sont des directions unitaires sur le globe. */
export interface BotState {
  profile: (typeof config.botProfiles)[number];
  mode: Mode;
  /** Point visé en ce moment. */
  target: THREE.Vector3;
  /** Points de passage restants de la boucle en cours. */
  waypoints: THREE.Vector3[];
  /** Point de retour, à l'intérieur de sa zone. */
  home: THREE.Vector3;
  /** Temps passé hors de sa zone (s). */
  outTime: number;
  /** Compte à rebours avant la prochaine réévaluation lente (s). */
  thinkIn: number;
  /** Temps de pause restant dans sa zone avant la prochaine boucle (s). */
  rest: number;
}

export function createBot(index: number): BotState {
  const profile = config.botProfiles[index % config.botProfiles.length] ?? config.botProfiles[0]!;
  return {
    profile,
    mode: 'home',
    target: new THREE.Vector3(),
    waypoints: [],
    home: new THREE.Vector3(),
    outTime: 0,
    thinkIn: 0,
    rest: 0,
  };
}

const tmpAxis = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const cellDir = [0, 0, 0];

/** Avance `pos` de `angle` radians le long de `dir`, et transporte `dir` avec lui. */
function advance(pos: THREE.Vector3, dir: THREE.Vector3, angle: number): void {
  tmpAxis.crossVectors(pos, dir).normalize();
  pos.applyAxisAngle(tmpAxis, angle).normalize();
  dir.applyAxisAngle(tmpAxis, angle);
  dir.addScaledVector(pos, -dir.dot(pos)).normalize();
}

function cellAt(territory: Territory, p: THREE.Vector3): number {
  return dirToCell(territory.n, p.x, p.y, p.z);
}

/** Choisit un cap de sortie : de préférence vers de la terre qui n'est pas à lui. */
function pickExit(bot: BotState, me: Player, territory: Territory): void {
  let best = 0;
  let bestScore = -1;
  for (let attempt = 0; attempt < 8; attempt++) {
    const bearing = Math.random() * Math.PI * 2;
    tmpPos.copy(me.pawn.pos);
    tmpDir.copy(me.pawn.up).applyAxisAngle(me.pawn.pos, bearing);
    let score = 0;
    for (let i = 0; i < 4; i++) {
      advance(tmpPos, tmpDir, 4 * DEG);
      const cell = cellAt(territory, tmpPos);
      if (territory.country[cell] !== SEA && territory.owner[cell] !== me.id) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = bearing;
    }
  }
  // Point visé loin devant : le rival marche droit jusqu'à sortir de sa zone.
  bot.target.copy(me.pawn.pos);
  tmpDir.copy(me.pawn.up).applyAxisAngle(me.pawn.pos, best);
  advance(bot.target, tmpDir, 60 * DEG);
  bot.mode = 'home';
}

/** À la sortie de zone : trace une boucle rectangulaire qui revient chez soi. */
function planLoop(bot: BotState, me: Player): void {
  const { loopMin, loopMax } = bot.profile;
  const a = (loopMin + Math.random() * (loopMax - loopMin)) * DEG;
  const b = (loopMin + Math.random() * (loopMax - loopMin)) * DEG;
  const side = Math.random() < 0.5 ? 1 : -1;

  // Point de retour : un peu en arrière du point de sortie, donc à l'intérieur de la zone.
  bot.home.copy(me.pawn.pos);
  tmpDir.copy(me.pawn.heading).negate();
  advance(bot.home, tmpDir, 1.5 * DEG);

  const p = me.pawn.pos.clone();
  const d = me.pawn.heading.clone();
  bot.waypoints.length = 0;
  advance(p, d, a);
  bot.waypoints.push(p.clone());
  d.applyAxisAngle(p, (side * Math.PI) / 2);
  advance(p, d, b);
  bot.waypoints.push(p.clone());
  d.applyAxisAngle(p, (side * Math.PI) / 2);
  advance(p, d, a * 0.6);
  bot.waypoints.push(p.clone());

  bot.target.copy(bot.waypoints.shift() ?? bot.home);
  bot.mode = 'loop';
  bot.outTime = 0;
}

/** Cherche un point de retour valable quand le point prévu n'est plus à lui. */
function refreshHome(bot: BotState, me: Player, territory: Territory): void {
  if (territory.owner[cellAt(territory, bot.home)] === me.id) return;
  let best = -2;
  for (let p = 0; p < territory.countryCount; p++) {
    if (territory.share(me.id, p) <= 0) continue;
    const c = p * 3;
    const centers = territory.countryCenter;
    const dot =
      (centers[c] ?? 0) * me.pawn.pos.x + (centers[c + 1] ?? 0) * me.pawn.pos.y + (centers[c + 2] ?? 0) * me.pawn.pos.z;
    if (dot > best) {
      best = dot;
      bot.home.set(centers[c] ?? 0, centers[c + 1] ?? 0, centers[c + 2] ?? 0);
    }
  }
}

/** Pendant la pause : vise le repère d'un de ses pays, tiré au hasard parmi les plus proches. */
function restTarget(bot: BotState, me: Player, territory: Territory): void {
  const centers = territory.countryCenter;
  let best = -2;
  let found = false;
  for (let p = 0; p < territory.countryCount; p++) {
    if (territory.share(me.id, p) < 1) continue;
    const c = p * 3;
    const dot =
      (centers[c] ?? 0) * me.pawn.pos.x + (centers[c + 1] ?? 0) * me.pawn.pos.y + (centers[c + 2] ?? 0) * me.pawn.pos.z;
    // Un peu de hasard pour ne pas toujours viser le même pays.
    const score = dot + Math.random() * 0.02;
    if (score > best && dot < Math.cos(1.5 * DEG)) {
      best = score;
      bot.target.set(centers[c] ?? 0, centers[c + 1] ?? 0, centers[c + 2] ?? 0);
      found = true;
    }
  }
  // Aucun pays entier à viser : il fait demi-tour vers l'intérieur.
  if (!found) {
    bot.target.copy(me.pawn.pos);
    tmpDir.copy(me.pawn.heading).negate();
    advance(bot.target, tmpDir, 3 * DEG);
  }
}

/** Un chasseur cherche la traînée la plus tentante à portée : le plus gros attire de plus loin. */
function findPrey(me: Player, players: readonly Player[], territory: Territory, out: THREE.Vector3): boolean {
  let found = false;
  let bestMargin = 0;
  for (const other of players) {
    if (other.id === me.id || !other.alive || territory.trailLength(other.id) < 6) continue;
    const middle = territory.trailMiddle(other.id);
    if (middle < 0) continue;
    cellToDir(territory.n, middle, cellDir);
    tmpPos.set(cellDir[0] ?? 0, cellDir[1] ?? 0, cellDir[2] ?? 0);
    const range = config.botHuntDeg + config.botHuntPerCountryDeg * territory.countriesOwned(other.id);
    const margin = range * DEG - me.pawn.pos.angleTo(tmpPos);
    if (margin > bestMargin) {
      bestMargin = margin;
      out.copy(tmpPos);
      found = true;
    }
  }
  return found;
}

/** Décide du cap d'un rival pour ce pas de simulation. */
export function updateBot(
  bot: BotState,
  me: Player,
  players: readonly Player[],
  territory: Territory,
  dt: number,
): void {
  const pawn = me.pawn;
  const atHome = territory.owner[cellAt(territory, pawn.pos)] === me.id;
  const out = territory.trailLength(me.id) > 0;

  if (bot.mode === 'home') {
    if (!atHome && bot.rest <= 0) planLoop(bot, me);
    else if (bot.rest > 0) {
      // En pause : géré plus bas.
    } else if (bot.target.lengthSq() < 0.5 || pawn.pos.angleTo(bot.target) < 5 * DEG) pickExit(bot, me, territory);
  } else if (atHome && !out) {
    // Boucle fermée (ou rentré sans rien tracer) : une pause chez soi, puis une autre boucle.
    bot.mode = 'home';
    bot.outTime = 0;
    bot.rest = config.botRestMin + Math.random() * (config.botRestMax - config.botRestMin);
    restTarget(bot, me, territory);
  }
  if (bot.rest > 0 && bot.mode === 'home') {
    bot.rest -= dt;
    // Pendant la pause, il se promène vers le cœur de sa zone sans en sortir.
    if (!atHome || pawn.pos.angleTo(bot.target) < 1.5 * DEG) restTarget(bot, me, territory);
    if (bot.rest <= 0) pickExit(bot, me, territory);
  }

  if (out) bot.outTime += dt;

  // Réévaluations lentes : menaces, proies, point de retour.
  bot.thinkIn -= dt;
  if (bot.thinkIn <= 0) {
    bot.thinkIn = 0.25;
    if (bot.mode === 'loop' || bot.mode === 'hunt') {
      let threatened = bot.outTime > config.botMaxOutTime;
      for (const other of players) {
        if (other.id === me.id || !other.alive) continue;
        if (other.pawn.pos.angleTo(pawn.pos) < config.botFearDeg * DEG) threatened = true;
      }
      if (threatened && (bot.mode === 'loop' || bot.outTime > config.botMaxOutTime)) bot.mode = 'return';
    }
    if (bot.profile.hunter && (bot.mode === 'home' || bot.mode === 'hunt') && bot.outTime <= config.botMaxOutTime) {
      if (findPrey(me, players, territory, bot.target)) bot.mode = 'hunt';
      else if (bot.mode === 'hunt') bot.mode = out ? 'return' : 'home';
    }
    if (bot.mode === 'return' || bot.mode === 'hunt') refreshHome(bot, me, territory);
  }

  if (bot.mode === 'loop' && pawn.pos.angleTo(bot.target) < config.botReachDeg * DEG) {
    const next = bot.waypoints.shift();
    if (next) bot.target.copy(next);
    else bot.mode = 'return';
  }
  if (bot.mode === 'return') bot.target.copy(bot.home);

  // Cap vers le point visé : direction tangente au globe.
  tmpDir.copy(bot.target).addScaledVector(pawn.pos, -bot.target.dot(pawn.pos));
  if (tmpDir.lengthSq() > 1e-10) pawn.steerWorld(tmpDir.normalize());
}
