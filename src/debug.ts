import type * as THREE from 'three';
import type { OrbitCamera } from './camera';
import type { LoopStats } from './loop';

/** Panneau de debug (?debug=1) : chargé à la demande, absent du jeu normal. */
export class DebugPanel {
  private readonly text: HTMLDivElement;
  private frames = 0;
  private elapsed = 0;
  private fps = 0;
  private worstMs = 0;

  constructor(
    private readonly stats: LoopStats,
    private readonly renderer: THREE.WebGLRenderer,
    orbit: OrbitCamera,
    private readonly countryCount: number,
    private readonly triangles: number,
  ) {
    stats.measure = true;

    const root = document.createElement('div');
    root.style.cssText =
      'position:fixed;left:8px;top:calc(8px + env(safe-area-inset-top,0px));z-index:10;' +
      'font:12px/1.4 ui-monospace,Menlo,monospace;color:#fff;background:rgba(0,0,0,.6);' +
      'padding:8px 10px;border-radius:8px;white-space:pre';
    this.text = document.createElement('div');
    root.appendChild(this.text);

    const button = document.createElement('button');
    button.style.cssText =
      'margin-top:6px;font:inherit;color:#fff;background:#6b5236;border:0;border-radius:6px;padding:6px 10px';
    const label = (): void => {
      button.textContent = orbit.gameView ? 'Vue globe' : 'Vue jeu (rapprochée)';
    };
    label();
    button.addEventListener('click', () => {
      orbit.gameView = !orbit.gameView;
      label();
    });
    root.appendChild(button);
    document.body.appendChild(root);
  }

  frame(): void {
    this.frames++;
    this.elapsed += this.stats.frameTime;
    this.worstMs = Math.max(this.worstMs, this.stats.frameTime * 1000);
    if (this.elapsed < 0.5) return;
    this.fps = this.frames / this.elapsed;
    const info = this.renderer.info.render;
    this.text.textContent =
      `${this.fps.toFixed(0)} fps · pire image ${this.worstMs.toFixed(0)} ms\n` +
      `simu ${this.stats.updateMs.toFixed(2)} ms · rendu ${this.stats.renderMs.toFixed(2)} ms\n` +
      `${this.countryCount} pays · ${Math.round(this.triangles / 1000)}k triangles · ${info.calls} appels`;
    this.frames = 0;
    this.elapsed = 0;
    this.worstMs = 0;
  }
}
