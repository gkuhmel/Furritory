import { config } from '../config';
import { dirToCell } from '../cube-grid';
import type { Player } from '../game';
import { SEA, type Territory } from '../territory';

const DEG = Math.PI / 180;

/**
 * Mini-carte : planisphère nord en haut, avec les zones de chacun et la position des pions.
 * Redessinée quelques fois par seconde seulement.
 */
export class Minimap {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly image: ImageData | null;
  /** Case de la grille correspondant à chaque pixel. */
  private readonly cellOfPixel: Int32Array;
  private readonly w: number;
  private readonly h: number;
  private readonly palette: [number, number, number][];
  private wait = 0;

  constructor(
    private readonly territory: Territory,
    private readonly players: readonly Player[],
  ) {
    this.w = config.minimapWidth;
    this.h = Math.round(this.w / 2);
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.canvas.style.cssText =
      'position:fixed;left:10px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:6;' +
      `width:${this.w}px;height:${this.h}px;border-radius:8px;pointer-events:none;` +
      'box-shadow:0 0 0 2px rgba(40,28,20,.85);image-rendering:pixelated';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.image = this.ctx ? this.ctx.createImageData(this.w, this.h) : null;

    this.cellOfPixel = new Int32Array(this.w * this.h);
    for (let y = 0; y < this.h; y++) {
      const lat = (90 - ((y + 0.5) / this.h) * 180) * DEG;
      for (let x = 0; x < this.w; x++) {
        const lon = (((x + 0.5) / this.w) * 360 - 180) * DEG;
        const c = Math.cos(lat);
        this.cellOfPixel[y * this.w + x] = dirToCell(territory.n, c * Math.sin(lon), Math.sin(lat), c * Math.cos(lon));
      }
    }
    this.palette = [[232, 211, 174], ...players.map((p) => rgb(p.color))];
  }

  /** À appeler à chaque image avec la durée de l'image. */
  update(frameTime: number): void {
    this.wait -= frameTime;
    if (this.wait > 0 || !this.ctx || !this.image) return;
    this.wait = config.minimapRefresh;

    const data = this.image.data;
    const owner = this.territory.owner;
    for (let i = 0; i < this.cellOfPixel.length; i++) {
      const who = owner[this.cellOfPixel[i] ?? 0] ?? SEA;
      const color = who === SEA ? SEA_COLOR : (this.palette[who] ?? SEA_COLOR);
      data[i * 4] = color[0];
      data[i * 4 + 1] = color[1];
      data[i * 4 + 2] = color[2];
      data[i * 4 + 3] = 255;
    }
    this.ctx.putImageData(this.image, 0, 0);

    // Les pions : un point cerclé de blanc, le joueur en plus gros.
    for (const p of this.players) {
      if (!p.alive) continue;
      const lat = Math.asin(Math.max(-1, Math.min(1, p.pawn.pos.y)));
      const lon = Math.atan2(p.pawn.pos.x, p.pawn.pos.z);
      const x = ((lon / DEG + 180) / 360) * this.w;
      const y = ((90 - lat / DEG) / 180) * this.h;
      const [r, g, b] = rgb(p.color);
      this.ctx.beginPath();
      this.ctx.arc(x, y, p.bot ? 2.5 : 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgb(${r},${g},${b})`;
      this.ctx.fill();
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = '#fff';
      this.ctx.stroke();
    }
  }
}

const SEA_COLOR: [number, number, number] = [79, 143, 156];

function rgb(color: number): [number, number, number] {
  return [(color >> 16) & 255, (color >> 8) & 255, color & 255];
}
