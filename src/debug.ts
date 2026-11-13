import type * as THREE from 'three';
import { config } from './config';
import type { LoopStats } from './loop';
import type { Pawn } from './pawn';
import type { Territory } from './territory';

const RAD = 180 / Math.PI;

type NumericKey = {
  [K in keyof typeof config]: (typeof config)[K] extends number ? K : never;
}[keyof typeof config];

/** Curseurs de réglage : [clé de config, libellé, min, max, pas]. */
const SLIDERS: [NumericKey, string, number, number, number][] = [
  ['viewSpanDeg', 'ZOOM : zone visible (°)', 6, 60, 1],
  ['pawnSpeed', 'Vitesse pion (°/s)', 1, 20, 0.25],
  ['seaSpeedFactor', 'Vitesse en mer (×)', 1, 4, 0.1],
  ['turnRate', 'Virage (°/s)', 60, 1800, 20],
  ['cameraTiltDeg', 'Inclinaison (°)', 0, 70, 1],
  ['fovDeg', 'Focale (°)', 25, 80, 1],
  ['pawnSizeDeg', 'Taille pion (°)', 0.3, 3, 0.1],
  ['stickRadiusPx', 'Rayon joystick (px)', 4, 80, 1],
];

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
    app: { globeView: boolean },
    private readonly pawn: Pawn,
    private readonly territory: Territory,
    private readonly countryCount: number,
    private readonly triangles: number,
  ) {
    stats.measure = true;

    const root = document.createElement('div');
    root.style.cssText =
      'position:fixed;left:8px;top:calc(70px + env(safe-area-inset-top,0px));z-index:10;' +
      'font:11px/1.4 ui-monospace,Menlo,monospace;color:#fff;background:rgba(0,0,0,.6);' +
      'padding:8px 10px;border-radius:8px;max-width:calc(100vw - 16px);box-sizing:border-box';
    this.text = document.createElement('div');
    this.text.style.whiteSpace = 'pre';
    root.appendChild(this.text);

    const buttonCss =
      'margin:6px 6px 0 0;font:inherit;color:#fff;background:#6b5236;border:0;border-radius:6px;padding:6px 10px';
    const viewButton = document.createElement('button');
    viewButton.style.cssText = buttonCss;
    const label = (): void => {
      viewButton.textContent = app.globeView ? 'Reprendre le jeu' : 'Vue globe (pause)';
    };
    label();
    viewButton.addEventListener('click', () => {
      app.globeView = !app.globeView;
      label();
    });

    const sliders = document.createElement('div');
    sliders.style.display = 'none';
    for (const [key, name, min, max, step] of SLIDERS) {
      const row = document.createElement('label');
      row.style.cssText = 'display:block;margin-top:6px';
      const caption = document.createElement('span');
      const range = document.createElement('input');
      range.type = 'range';
      range.min = String(min);
      range.max = String(max);
      range.step = String(step);
      range.value = String(config[key]);
      range.style.cssText = 'display:block;width:210px;touch-action:pan-x';
      const show = (): void => {
        caption.textContent = `${name} : ${config[key]}`;
      };
      show();
      range.addEventListener('input', () => {
        config[key] = Number(range.value);
        show();
      });
      row.append(caption, range);
      sliders.appendChild(row);
    }
    const tuneButton = document.createElement('button');
    tuneButton.style.cssText = buttonCss;
    tuneButton.textContent = 'Réglages';
    tuneButton.addEventListener('click', () => {
      sliders.style.display = sliders.style.display === 'none' ? 'block' : 'none';
    });

    root.append(viewButton, tuneButton, sliders);
    // Les touches sur le panneau ne doivent pas piloter le pion.
    root.addEventListener('pointerdown', (e) => e.stopPropagation());
    root.addEventListener('touchmove', (e) => e.stopPropagation());
    document.body.appendChild(root);
  }

  frame(): void {
    this.frames++;
    this.elapsed += this.stats.frameTime;
    this.worstMs = Math.max(this.worstMs, this.stats.frameTime * 1000);
    if (this.elapsed < 0.5) return;
    this.fps = this.frames / this.elapsed;
    const info = this.renderer.info.render;
    const p = this.pawn.pos;
    const lat = Math.asin(p.y) * RAD;
    const lon = Math.atan2(p.x, p.z) * RAD;
    this.text.textContent =
      `${this.fps.toFixed(0)} fps · pire image ${this.worstMs.toFixed(0)} ms\n` +
      `simu ${this.stats.updateMs.toFixed(2)} ms · rendu ${this.stats.renderMs.toFixed(2)} ms\n` +
      `${this.countryCount} pays · ${Math.round(this.triangles / 1000)}k tri · ${info.calls} appels\n` +
      `rendu ${this.renderer.domElement.width}×${this.renderer.domElement.height} · écran ×${window.devicePixelRatio}\n` +
      `pion lat ${lat.toFixed(1)}° lon ${lon.toFixed(1)}°\n` +
      `zone ${this.territory.countOwned(1)} cases · traînée ${this.territory.trailLength(1)}`;
    this.frames = 0;
    this.elapsed = 0;
    this.worstMs = 0;
  }
}
