import { type BotState, createBot, updateBot } from './bots';
import { config } from './config';
import { countryNames } from './country-names';
import { dirToCell } from './cube-grid';
import type { Input } from './input';
import { Pawn } from './pawn';
import type { Territory } from './territory';

export interface Player {
  /** Numéro dans la grille de territoire, à partir de 1. Le joueur humain est le 1. */
  id: number;
  name: string;
  color: number;
  pawn: Pawn;
  alive: boolean;
  /** Temps restant avant de réapparaître (s), quand il est mort. */
  respawnIn: number;
  /** Pays de départ préféré. */
  startCountry: number;
  /** Présent pour les rivaux pilotés par l'ordinateur. */
  bot: BotState | null;
}

/** Ce qui vient de se passer, à destination de l'affichage. */
export type GameEvent =
  | { type: 'trail'; player: number }
  | { type: 'capture'; player: number; flips: number[]; gainedCountries: number; gainedCells: number }
  | { type: 'death'; player: number; by: number }
  | { type: 'respawn'; player: number }
  | { type: 'end' };

export const HUMAN = 1;

/** Une partie : les joueurs, le chrono, et les règles qui les lient au territoire. */
export class Game {
  readonly players: Player[] = [];
  /** Événements produits depuis le dernier passage de l'affichage. */
  readonly events: GameEvent[] = [];
  timeLeft = config.gameDuration;
  over = false;

  constructor(
    readonly territory: Territory,
    private readonly input: Input,
  ) {
    const count = Math.min(config.playerColors.length, config.startCountries.length);
    for (let i = 0; i < count; i++) {
      const start = countryNames.indexOf(config.startCountries[i] ?? '');
      this.players.push({
        id: i + 1,
        name: config.playerNames[i] ?? `Joueur ${i + 1}`,
        color: config.playerColors[i] ?? 0xffffff,
        pawn: new Pawn(0, 0),
        alive: false,
        respawnIn: 0,
        startCountry: start,
        bot: i === 0 ? null : createBot(i - 1),
      });
      if (i > 0) this.players[i]!.pawn.speedFactor = config.botSpeedFactor;
    }
    this.restart();
  }

  get human(): Player {
    return this.players[0]!;
  }

  /** Nouvelle partie : territoire vierge, tout le monde à son pays de départ. */
  restart(): void {
    this.territory.reset();
    this.events.length = 0;
    this.timeLeft = config.gameDuration;
    this.over = false;
    for (const p of this.players) this.spawn(p);
    this.input.resetDir();
  }

  private cellOf(p: Player): number {
    return dirToCell(this.territory.n, p.pawn.pos.x, p.pawn.pos.y, p.pawn.pos.z);
  }

  /** Fait apparaître un joueur dans un pays neutre : le sien si possible, sinon un autre. */
  private spawn(p: Player): boolean {
    const t = this.territory;
    const isFree = (country: number): boolean => {
      if (country < 0 || (t.countrySize[country] ?? 0) === 0) return false;
      for (const other of this.players) if (t.share(other.id, country) > 0) return false;
      return true;
    };
    let country = isFree(p.startCountry) ? p.startCountry : -1;
    if (country < 0) {
      const candidates: number[] = [];
      for (let c = 0; c < t.countryCount; c++) {
        if ((t.countrySize[c] ?? 0) >= config.minSpawnCells && isFree(c)) candidates.push(c);
      }
      if (candidates.length === 0) return false;
      country = candidates[Math.floor(Math.random() * candidates.length)] ?? -1;
    }
    const c = country * 3;
    // Le joueur humain repart cap au nord, les rivaux dans une direction au hasard.
    p.pawn.resetAt(
      t.countryCenter[c] ?? 0,
      t.countryCenter[c + 1] ?? 0,
      t.countryCenter[c + 2] ?? 1,
      p.bot ? Math.random() * Math.PI * 2 : 0,
    );
    t.claimCountryAt(p.id, this.cellOf(p));
    p.alive = true;
    p.respawnIn = 0;
    if (p.bot) {
      p.bot.mode = 'home';
      p.bot.target.set(0, 0, 0);
      p.bot.waypoints.length = 0;
      p.bot.outTime = 0;
      p.bot.thinkIn = 0;
      p.bot.rest = 0;
    }
    if (p.id === HUMAN) this.input.resetDir();
    this.events.push({ type: 'respawn', player: p.id });
    return true;
  }

  private kill(p: Player, by: number): void {
    if (!p.alive) return;
    p.alive = false;
    p.respawnIn = config.respawnDelay;
    this.territory.wipe(p.id);
    this.events.push({ type: 'death', player: p.id, by });
  }

  update(dt: number): void {
    if (this.over) return;
    const t = this.territory;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.over = true;
      this.events.push({ type: 'end' });
      return;
    }

    for (const p of this.players) {
      if (!p.alive) {
        p.respawnIn -= dt;
        // S'il n'y a plus de pays libre, il retentera au pas suivant.
        if (p.respawnIn <= 0) this.spawn(p);
        continue;
      }

      if (p.bot) updateBot(p.bot, p, this.players, t, dt);
      else if (this.input.hasDir) p.pawn.steer(this.input.dirX, this.input.dirY);
      p.pawn.update(dt);

      const countriesBefore = t.countriesOwned(p.id);
      const event = t.step(p.id, this.cellOf(p));

      // Il vient de marcher sur la traînée d'un rival : ce rival est éliminé.
      if (t.lastCut !== 0) {
        const victim = this.players[t.lastCut - 1];
        if (victim) this.kill(victim, p.id);
      }

      if (event === 'trail') {
        if (t.trailLength(p.id) === 1) this.events.push({ type: 'trail', player: p.id });
      } else if (event === 'capture') {
        this.events.push({
          type: 'capture',
          player: p.id,
          flips: [...t.lastFlips],
          gainedCountries: t.countriesOwned(p.id) - countriesBefore,
          gainedCells: t.lastGain,
        });
        // Un joueur à qui il ne reste plus une seule case est éliminé.
        for (const other of this.players) {
          if (other.alive && other.id !== p.id && t.totalOwned(other.id) === 0) this.kill(other, p.id);
        }
      }
    }
  }

  /** Classement : nombre de pays entiers, puis nombre de cases pour départager. */
  ranking(): { player: Player; countries: number; cells: number }[] {
    const t = this.territory;
    return this.players
      .map((player) => ({ player, countries: t.countriesOwned(player.id), cells: t.totalOwned(player.id) }))
      .sort((a, b) => b.countries - a.countries || b.cells - a.cells);
  }
}
