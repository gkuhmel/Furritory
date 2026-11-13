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

  constructor(target: HTMLElement) {
    target.addEventListener('pointerdown', (e) => {
      if (this.down) return;
      this.down = true;
      this.pointerId = e.pointerId;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.dx = 0;
      this.dy = 0;
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
