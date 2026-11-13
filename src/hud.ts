import { config } from './config';

/**
 * Message court en bas de l'écran (consigne, capture, mort).
 * Un seul message à la fois ; il s'efface tout seul.
 */
export class Hud {
  private readonly box: HTMLDivElement;
  private timer = 0;

  constructor() {
    // Bandeau pleine largeur qui centre la bulle : elle peut ainsi occuper presque tout l'écran.
    const row = document.createElement('div');
    row.style.cssText =
      'position:fixed;left:16px;right:16px;z-index:6;pointer-events:none;display:flex;' +
      'justify-content:center;bottom:calc(28px + env(safe-area-inset-bottom,0px))';
    this.box = document.createElement('div');
    this.box.style.cssText =
      'padding:10px 18px;border-radius:22px;background:rgba(40,28,20,.82);color:#fff;' +
      'font:600 16px/1.25 system-ui,-apple-system,sans-serif;text-align:center;' +
      'opacity:0;transition:opacity .25s';
    row.appendChild(this.box);
    document.body.appendChild(row);
  }

  /** Affiche un message ; `sticky` le garde jusqu'au prochain `hide` ou `show`. */
  show(text: string, sticky = false): void {
    window.clearTimeout(this.timer);
    this.box.textContent = text;
    this.box.style.opacity = '1';
    if (!sticky) this.timer = window.setTimeout(() => this.hide(), config.hudMessageTime * 1000);
  }

  hide(): void {
    window.clearTimeout(this.timer);
    this.box.style.opacity = '0';
  }
}
