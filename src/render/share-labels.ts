import * as THREE from 'three';
import { config } from '../config';
import type { Territory } from '../territory';

interface Label {
  el: HTMLDivElement;
  fill: HTMLDivElement;
  text: HTMLSpanElement;
  country: number;
}

/**
 * Étiquettes posées sur les pays entamés par le joueur : la part conquise, en pourcentage,
 * avec une jauge dont le trait marque le seuil de bascule.
 */
export class ShareLabels {
  private readonly root: HTMLDivElement;
  private readonly pool: Label[] = [];
  private active = 0;
  private readonly at = new THREE.Vector3();
  private readonly eye = new THREE.Vector3();

  constructor(
    private readonly territory: Territory,
    private readonly player: number,
  ) {
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:fixed;inset:0;z-index:4;pointer-events:none;overflow:hidden';
    document.body.appendChild(this.root);
  }

  private make(): Label {
    const el = document.createElement('div');
    el.style.cssText =
      'position:absolute;left:0;top:0;padding:4px 8px 6px;border-radius:10px;' +
      'background:rgba(40,28,20,.85);color:#fff;text-align:center;white-space:nowrap;' +
      'font:700 14px/1.1 system-ui,-apple-system,sans-serif;will-change:transform';
    const text = document.createElement('span');
    const track = document.createElement('div');
    track.style.cssText =
      'position:relative;width:46px;height:4px;margin:4px auto 0;border-radius:2px;background:rgba(255,255,255,.3)';
    const fill = document.createElement('div');
    fill.style.cssText = 'height:100%;border-radius:2px;background:#ffb39c';
    const mark = document.createElement('div');
    mark.style.cssText = `position:absolute;top:-2px;bottom:-2px;left:${config.flipThreshold * 100}%;width:2px;background:#fff`;
    track.append(fill, mark);
    el.append(text, track);
    this.root.appendChild(el);
    return { el, fill, text, country: -1 };
  }

  /** À appeler quand le territoire change : refait la liste des pays entamés. */
  refresh(): void {
    this.active = 0;
    const t = this.territory;
    for (let p = 0; p < t.countryCount; p++) {
      const share = t.share(this.player, p);
      if (share <= 0 || share >= 1) continue;
      let label = this.pool[this.active];
      if (!label) {
        label = this.make();
        this.pool.push(label);
      }
      label.country = p;
      // Jamais « 0 % » pour un pays entamé, jamais « 50 % » tant qu'il n'a pas basculé.
      const percent = Math.min(Math.max(1, Math.floor(share * 100)), Math.ceil(config.flipThreshold * 100) - 1);
      label.text.textContent = `${percent} %`;
      label.fill.style.width = `${share * 100}%`;
      this.active++;
    }
    for (let i = this.active; i < this.pool.length; i++) {
      const label = this.pool[i];
      if (label) label.el.style.display = 'none';
    }
  }

  /** Nombre d'étiquettes affichées. */
  get count(): number {
    return this.active;
  }

  /** À appeler à chaque image : place les étiquettes à l'écran, cache celles derrière le globe. */
  update(camera: THREE.PerspectiveCamera, width: number, height: number): void {
    const centers = this.territory.countryCenter;
    this.eye.copy(camera.position);
    for (let i = 0; i < this.active; i++) {
      const label = this.pool[i];
      if (!label) continue;
      const c = label.country * 3;
      this.at.set(centers[c] ?? 0, centers[c + 1] ?? 0, centers[c + 2] ?? 0);
      // Visible si le point est du côté de la caméra par rapport à l'horizon du globe.
      const facing = this.at.dot(this.eye) > 1;
      this.at.multiplyScalar(1 + config.landHeight).project(camera);
      const onScreen = facing && Math.abs(this.at.x) < 1.1 && Math.abs(this.at.y) < 1.1 && this.at.z < 1;
      if (!onScreen) {
        label.el.style.display = 'none';
        continue;
      }
      const x = (this.at.x * 0.5 + 0.5) * width;
      const y = (-this.at.y * 0.5 + 0.5) * height;
      label.el.style.display = 'block';
      label.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%)`;
    }
  }
}
