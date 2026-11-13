import { config } from './config';

/**
 * Entrée tactile : un seul doigt suivi, déplacements cumulés en pixels CSS.
 * Bloque tous les gestes parasites de Safari (zoom, scroll, menu contextuel).
 */
export class Input {
  /** Vrai tant qu'un doigt est posé. */
  down = false;
  private pointerId = -1;
  private lastX = 0;
  private lastY = 0;
  private dx = 0;
  private dy = 0;
  /** Joystick invisible : dernier cap donné, en direction d'écran normalisée (y vers le bas). */
  dirX = 0;
  dirY = -1;
  /** Vrai dès qu'un cap a été donné au moins une fois. */
  hasDir = false;
  private anchorX = 0;
  private anchorY = 0;

  constructor(target: HTMLElement) {
    target.addEventListener('pointerdown', (e) => {
      if (this.down) return;
      this.down = true;
      this.pointerId = e.pointerId;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.dx = 0;
      this.dy = 0;
      this.anchorX = e.clientX;
      this.anchorY = e.clientY;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Capture indisponible : sans conséquence.
      }
    });
    target.addEventListener('pointermove', (e) => {
      if (!this.down || e.pointerId !== this.pointerId) return;
      this.dx += e.clientX - this.lastX;
      this.dy += e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      // Cap = direction ancre → doigt. Seule la direction compte, pas la longueur du geste.
      const ox = e.clientX - this.anchorX;
      const oy = e.clientY - this.anchorY;
      const len = Math.hypot(ox, oy);
      if (len > config.stickDeadzonePx) {
        this.dirX = ox / len;
        this.dirY = oy / len;
        this.hasDir = true;
      }
      if (len > config.stickRadiusPx) {
        // L'ancre se laisse traîner derrière le doigt.
        const k = (len - config.stickRadiusPx) / len;
        this.anchorX += ox * k;
        this.anchorY += oy * k;
      }
    });
    const release = (e: PointerEvent): void => {
      if (e.pointerId !== this.pointerId) return;
      this.down = false;
      this.pointerId = -1;
    };
    target.addEventListener('pointerup', release);
    target.addEventListener('pointercancel', release);

    // Gestes Safari à neutraliser.
    const block = (e: Event): void => e.preventDefault();
    for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'contextmenu', 'dblclick']) {
      document.addEventListener(type, block, { passive: false });
    }
    document.addEventListener('touchmove', block, { passive: false });
  }

  /** Renvoie le déplacement accumulé depuis le dernier appel, puis le remet à zéro. */
  consumeDrag(out: { x: number; y: number }): void {
    out.x = this.dx;
    out.y = this.dy;
    this.dx = 0;
    this.dy = 0;
  }
}
