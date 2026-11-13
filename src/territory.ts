import { config } from './config';
import { cellToDir, neighbor } from './cube-grid';

/** Valeur « mer » dans les tables par case. */
export const SEA = 255;

/** Valeur « pays partagé » dans `countryState`. */
export const MIXED = 254;

export type StepEvent = 'none' | 'trail' | 'capture' | 'death';

/**
 * État du territoire sur la grille : à qui appartient chaque case, et les traînées en cours.
 * Les joueurs sont numérotés à partir de 1 ; 0 = personne.
 */
export class Territory {
  readonly n: number;
  readonly cells: number;
  /** Indice du pays par case, `SEA` en mer. */
  readonly country: Uint8Array;
  /** Propriétaire par case (0 = neutre), `SEA` en mer. Sert aussi de texture pour le rendu. */
  readonly owner: Uint8Array;
  /** Joueur dont la traînée passe sur la case (0 = aucune). */
  readonly trail: Uint8Array;
  /** Vrai si la table `owner` a changé depuis le dernier envoi au GPU. */
  dirty = true;

  /** Cases de la traînée du joueur, dans l'ordre de passage. */
  private readonly trailCells: number[] = [];
  private lastCell = -1;
  /** Cases de terre gagnées lors de la dernière capture. */
  lastGain = 0;
  /** Pays qui ont basculé lors de la dernière capture. */
  readonly lastFlips: number[] = [];

  /**
   * État de chaque pays pour le rendu : 0 = à personne, 1..6 = entièrement à ce joueur,
   * `MIXED` = partagé. Mis à jour par `refreshCountryState`.
   */
  readonly countryState = new Uint8Array(256);
  /** Point de repère de chaque pays (x, y, z) : une case au cœur de son plus grand morceau. */
  readonly countryCenter: Float32Array;

  /** Nombre de pays (indices 0..countryCount-1). */
  readonly countryCount: number;
  /** Nombre de cases de chaque pays. */
  readonly countrySize: Int32Array;
  /** Cases possédées par joueur et par pays : indice joueur · 256 + pays. */
  private readonly owned: Int32Array;
  /** Cases regroupées par pays : celles du pays p vont de countryStart[p] à countryStart[p + 1]. */
  private readonly countryCells: Int32Array;
  private readonly countryStart: Int32Array;

  private readonly label: Int32Array;
  private readonly queue: Int32Array;
  /** Table des 4 voisines de chaque case, calculée une fois : les remplissages n'ont plus qu'à lire. */
  private readonly near: Int32Array;

  constructor(grid: Uint8Array) {
    this.n = (grid[0] ?? 0) | ((grid[1] ?? 0) << 8);
    this.cells = 6 * this.n * this.n;
    if (grid.length !== this.cells + 2) throw new Error('world-grid.bin : taille inattendue');
    this.country = grid.subarray(2);
    this.owner = new Uint8Array(this.cells);
    for (let c = 0; c < this.cells; c++) this.owner[c] = this.country[c] === SEA ? SEA : 0;
    this.trail = new Uint8Array(this.cells);
    this.label = new Int32Array(this.cells);
    this.queue = new Int32Array(this.cells);
    let maxCountry = -1;
    for (let c = 0; c < this.cells; c++) {
      const p = this.country[c] ?? SEA;
      if (p !== SEA && p > maxCountry) maxCountry = p;
    }
    this.countryCount = maxCountry + 1;
    this.countrySize = new Int32Array(this.countryCount);
    for (let c = 0; c < this.cells; c++) {
      const p = this.country[c] ?? SEA;
      if (p !== SEA) this.countrySize[p] = (this.countrySize[p] ?? 0) + 1;
    }
    this.countryStart = new Int32Array(this.countryCount + 1);
    for (let p = 0; p < this.countryCount; p++) {
      this.countryStart[p + 1] = (this.countryStart[p] ?? 0) + (this.countrySize[p] ?? 0);
    }
    this.countryCells = new Int32Array(this.countryStart[this.countryCount] ?? 0);
    const fill = this.countryStart.slice(0, this.countryCount);
    for (let c = 0; c < this.cells; c++) {
      const p = this.country[c] ?? SEA;
      if (p === SEA) continue;
      const at = fill[p] ?? 0;
      this.countryCells[at] = c;
      fill[p] = at + 1;
    }
    this.owned = new Int32Array((config.playerColors.length + 1) * 256);

    this.near = new Int32Array(this.cells * 4);
    for (let c = 0; c < this.cells; c++) {
      for (let k = 0; k < 4; k++) this.near[c * 4 + k] = neighbor(this.n, c, k);
    }
    this.countryCenter = new Float32Array(this.countryCount * 3);
    this.computeCenters();
  }

  /** Recalcule `countryState` à partir des décomptes par pays. */
  refreshCountryState(): void {
    const players = config.playerColors.length;
    for (let p = 0; p < this.countryCount; p++) {
      const size = this.countrySize[p] ?? 0;
      let state = 0;
      for (let who = 1; who <= players; who++) {
        const mine = this.owned[who * 256 + p] ?? 0;
        if (mine === 0) continue;
        state = mine === size ? who : MIXED;
        break;
      }
      this.countryState[p] = state;
    }
  }

  /**
   * Repère de chaque pays : la case de son plus grand morceau d'un seul tenant la plus proche
   * du centre de ce morceau. Toujours sur le pays, même pour une forme en croissant.
   */
  private computeCenters(): void {
    const { label, queue, near, country } = this;
    label.fill(0);
    const dir = [0, 0, 0];
    const bestSize = new Int32Array(this.countryCount);
    for (let start = 0; start < this.cells; start++) {
      const p = country[start] ?? SEA;
      if (p === SEA || label[start] !== 0) continue;
      let head = 0;
      let tail = 0;
      queue[tail++] = start;
      label[start] = 1;
      let sx = 0;
      let sy = 0;
      let sz = 0;
      while (head < tail) {
        const c = queue[head++] ?? 0;
        cellToDir(this.n, c, dir);
        sx += dir[0] ?? 0;
        sy += dir[1] ?? 0;
        sz += dir[2] ?? 0;
        for (let k = 0; k < 4; k++) {
          const o = near[c * 4 + k] ?? 0;
          if (label[o] === 0 && country[o] === p) {
            label[o] = 1;
            queue[tail++] = o;
          }
        }
      }
      if (tail <= (bestSize[p] ?? 0)) continue;
      bestSize[p] = tail;
      let best = -Infinity;
      for (let i = 0; i < tail; i++) {
        cellToDir(this.n, queue[i] ?? 0, dir);
        const dot = (dir[0] ?? 0) * sx + (dir[1] ?? 0) * sy + (dir[2] ?? 0) * sz;
        if (dot > best) {
          best = dot;
          this.countryCenter[p * 3] = dir[0] ?? 0;
          this.countryCenter[p * 3 + 1] = dir[1] ?? 0;
          this.countryCenter[p * 3 + 2] = dir[2] ?? 0;
        }
      }
    }
  }

  get trailLength(): number {
    return this.trailCells.length;
  }

  private setOwner(cell: number, player: number): void {
    const before = this.owner[cell] ?? 0;
    if (before === player) return;
    const p = this.country[cell] ?? SEA;
    this.owned[before * 256 + p] = (this.owned[before * 256 + p] ?? 0) - 1;
    this.owned[player * 256 + p] = (this.owned[player * 256 + p] ?? 0) + 1;
    this.lastGain++;
    this.owner[cell] = player;
    this.dirty = true;
  }

  /** Part du pays possédée par le joueur, entre 0 et 1. */
  share(player: number, country: number): number {
    const size = this.countrySize[country] ?? 0;
    return size > 0 ? (this.owned[player * 256 + country] ?? 0) / size : 0;
  }

  /** Nombre de pays possédés en entier par le joueur : c'est le score. */
  countriesOwned(player: number): number {
    let count = 0;
    for (let p = 0; p < this.countryCount; p++) {
      const size = this.countrySize[p] ?? 0;
      if (size > 0 && this.owned[player * 256 + p] === size) count++;
    }
    return count;
  }

  /** Donne au joueur toutes les cases d'un pays. */
  claimCountry(player: number, country: number): void {
    const end = this.countryStart[country + 1] ?? 0;
    for (let i = this.countryStart[country] ?? 0; i < end; i++) {
      this.setOwner(this.countryCells[i] ?? 0, player);
    }
  }

  /**
   * Bascule : tout pays dont le joueur possède au moins `flipThreshold` passe entièrement à lui.
   * Renvoie les pays basculés dans `lastFlips`.
   */
  private flipCountries(player: number): void {
    this.lastFlips.length = 0;
    for (let p = 0; p < this.countryCount; p++) {
      const size = this.countrySize[p] ?? 0;
      const mine = this.owned[player * 256 + p] ?? 0;
      if (mine === size || mine < size * config.flipThreshold) continue;
      this.claimCountry(player, p);
      this.lastFlips.push(p);
    }
  }

  /** Donne au joueur le pays entier qui contient `cell` (pays de départ). */
  claimCountryAt(player: number, cell: number): void {
    const country = this.country[cell];
    if (country === undefined || country === SEA) return;
    this.claimCountry(player, country);
    this.lastCell = cell;
  }

  /** Retire au joueur tout son territoire et sa traînée (mort). */
  wipe(player: number): void {
    for (let c = 0; c < this.cells; c++) {
      if (this.owner[c] === player) this.setOwner(c, 0);
    }
    this.clearTrail();
    this.lastCell = -1;
  }

  private clearTrail(): void {
    for (const c of this.trailCells) this.trail[c] = 0;
    this.trailCells.length = 0;
  }

  /** À appeler à chaque pas de simulation avec la case où se trouve le pion. */
  step(player: number, cell: number): StepEvent {
    if (cell === this.lastCell) return 'none';
    this.lastCell = cell;

    if (this.owner[cell] === player) {
      if (this.trailCells.length === 0) return 'none';
      this.capture(player);
      return 'capture';
    }

    if (this.trail[cell] === player) {
      // Les toutes dernières cases sont tolérées : on ne meurt pas d'un simple tremblement.
      const index = this.trailCells.lastIndexOf(cell);
      if (this.trailCells.length - 1 - index > config.trailGraceCells) return 'death';
      return 'none';
    }

    this.trail[cell] = player;
    this.trailCells.push(cell);
    return 'trail';
  }

  /**
   * Ferme la boucle : la traînée et tout ce qu'elle enferme passent au joueur.
   * Sur une sphère il n'y a pas d'« extérieur » : parmi les régions que la traînée sépare,
   * la plus grande est le reste du monde, toutes les autres sont capturées.
   */
  private capture(player: number): void {
    const { near, owner, trail, label, queue } = this;
    this.lastGain = 0;
    label.fill(0);
    const sizes: number[] = [0];

    for (const t of this.trailCells) {
      for (let k = 0; k < 4; k++) {
        const seed = near[t * 4 + k] ?? 0;
        if (label[seed] !== 0 || owner[seed] === player || trail[seed] === player) continue;
        // Nouvelle région : remplissage par diffusion.
        const id = sizes.length;
        let head = 0;
        let tail = 0;
        queue[tail++] = seed;
        label[seed] = id;
        while (head < tail) {
          const c = queue[head++] ?? 0;
          for (let d = 0; d < 4; d++) {
            const o = near[c * 4 + d] ?? 0;
            if (label[o] !== 0 || owner[o] === player || trail[o] === player) continue;
            label[o] = id;
            queue[tail++] = o;
          }
        }
        sizes.push(tail);
      }
    }

    let outside = 0;
    for (let id = 1; id < sizes.length; id++) {
      if ((sizes[id] ?? 0) > (sizes[outside] ?? 0)) outside = id;
    }

    if (sizes.length > 2) {
      for (let c = 0; c < this.cells; c++) {
        const id = label[c] ?? 0;
        if (id !== 0 && id !== outside && owner[c] !== SEA) this.setOwner(c, player);
      }
    }
    // La traînée elle-même devient du territoire, sauf en mer.
    for (const t of this.trailCells) {
      if (owner[t] !== SEA) this.setOwner(t, player);
    }
    this.clearTrail();
    this.flipCountries(player);
  }

  /** Nombre de cases de terre possédées par le joueur (debug). */
  countOwned(player: number): number {
    let count = 0;
    for (let c = 0; c < this.cells; c++) if (this.owner[c] === player) count++;
    return count;
  }
}
