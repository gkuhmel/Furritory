import { config } from './config';
import { neighbor } from './cube-grid';

/** Valeur « mer » dans les tables par case. */
export const SEA = 255;

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
    this.near = new Int32Array(this.cells * 4);
    for (let c = 0; c < this.cells; c++) {
      for (let k = 0; k < 4; k++) this.near[c * 4 + k] = neighbor(this.n, c, k);
    }
  }

  get trailLength(): number {
    return this.trailCells.length;
  }

  private setOwner(cell: number, player: number): void {
    if (this.owner[cell] !== player) this.lastGain++;
    this.owner[cell] = player;
    this.dirty = true;
  }

  /** Donne au joueur tout le morceau de pays d'un seul tenant qui contient `cell`. */
  claimCountryAt(player: number, cell: number): void {
    const country = this.country[cell];
    if (country === undefined || country === SEA) return;
    const queue = this.queue;
    let head = 0;
    let tail = 0;
    queue[tail++] = cell;
    this.setOwner(cell, player);
    while (head < tail) {
      const c = queue[head++] ?? 0;
      for (let k = 0; k < 4; k++) {
        const o = this.near[c * 4 + k] ?? 0;
        if (this.country[o] === country && this.owner[o] !== player) {
          this.setOwner(o, player);
          queue[tail++] = o;
        }
      }
    }
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
  }

  /** Nombre de cases de terre possédées par le joueur (debug). */
  countOwned(player: number): number {
    let count = 0;
    for (let c = 0; c < this.cells; c++) if (this.owner[c] === player) count++;
    return count;
  }
}
