import { config } from './config';

/**
 * Message court en bas de l'écran (consigne, capture, mort).
 * Un seul message à la fois ; il s'efface tout seul.
 */
export class Hud {
  private readonly box: HTMLDivElement;
  private timer = 0;
  private readonly countryName: HTMLSpanElement;
  private readonly score: HTMLDivElement;

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

    // En haut : le pays sous le pion à gauche, le score à droite.
    const top = document.createElement('div');
    top.style.cssText =
      'position:fixed;left:12px;right:12px;z-index:6;pointer-events:none;display:flex;' +
      'justify-content:space-between;align-items:flex-start;gap:8px;' +
      'top:calc(10px + env(safe-area-inset-top,0px));color:#fff;' +
      'font:600 15px/1.2 system-ui,-apple-system,sans-serif';
    const chip = 'padding:8px 12px;border-radius:14px;background:rgba(40,28,20,.82)';

    const country = document.createElement('div');
    country.style.cssText = chip + ';max-width:62vw';
    this.countryName = document.createElement('span');
    country.append(this.countryName);

    this.score = document.createElement('div');
    this.score.style.cssText = chip + ';white-space:nowrap';
    top.append(country, this.score);
    document.body.appendChild(top);

    // Version du build, discrète, en bas à droite : permet de vérifier ce qui est déployé.
    const version = document.createElement('div');
    version.textContent = __BUILD_ID__;
    version.style.cssText =
      'position:fixed;right:8px;bottom:calc(4px + env(safe-area-inset-bottom,0px));z-index:6;' +
      'pointer-events:none;color:rgba(255,255,255,.55);font:10px/1 ui-monospace,Menlo,monospace';
    document.body.appendChild(version);
  }

  /** Affiche un message ; `sticky` le garde jusqu'au prochain `hide` ou `show`. */
  show(text: string, sticky = false): void {
    window.clearTimeout(this.timer);
    this.box.textContent = text;
    this.box.style.opacity = '1';
    if (!sticky) this.timer = window.setTimeout(() => this.hide(), config.hudMessageTime * 1000);
  }

  /** Nom du pays sous le pion ; vide = en mer. */
  setCountry(name: string): void {
    this.countryName.textContent = name || 'En mer';
  }

  setScore(owned: number, total: number): void {
    this.score.textContent = `${owned} / ${total} pays`;
  }

  hide(): void {
    window.clearTimeout(this.timer);
    this.box.style.opacity = '0';
  }
}
