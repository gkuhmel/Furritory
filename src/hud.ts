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
  private readonly endScreen: HTMLDivElement;
  private readonly endBody: HTMLDivElement;

  constructor() {
    // Bandeau pleine largeur qui centre la bulle : elle peut ainsi occuper presque tout l'écran.
    const row = document.createElement('div');
    row.style.cssText =
      'position:fixed;left:16px;right:16px;z-index:6;pointer-events:none;display:flex;' +
      'justify-content:center;bottom:calc(96px + env(safe-area-inset-bottom,0px))';
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

    // Écran de fin : voile sombre et panneau centré. Il laisse passer les touches vers le jeu.
    this.endScreen = document.createElement('div');
    this.endScreen.style.cssText =
      'position:fixed;inset:0;z-index:8;pointer-events:none;display:none;align-items:center;' +
      'justify-content:center;background:rgba(20,14,10,.6);color:#fff;' +
      'font:600 16px/1.3 system-ui,-apple-system,sans-serif;text-align:center';
    this.endBody = document.createElement('div');
    this.endBody.style.cssText =
      'width:min(320px,calc(100vw - 48px));padding:22px 18px;border-radius:20px;background:rgba(40,28,20,.94)';
    this.endScreen.appendChild(this.endBody);
    document.body.appendChild(this.endScreen);

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

  /** Chrono (secondes restantes) et nombre de pays du joueur. */
  setScore(owned: number, timeLeft: number): void {
    const s = Math.ceil(timeLeft);
    const clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    this.score.textContent = `${clock} · ${owned} pays`;
  }

  /** Écran de fin : classement, score et meilleur score. */
  showEnd(lines: { name: string; color: string; countries: number; me: boolean }[], best: number, isRecord: boolean): void {
    this.endBody.textContent = '';
    const title = document.createElement('div');
    title.textContent = 'Fin de partie';
    title.style.cssText = 'font-size:26px;font-weight:800;margin-bottom:14px';
    this.endBody.appendChild(title);
    lines.forEach((line, i) => {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:10px;' +
        (line.me ? 'background:rgba(255,255,255,.16);font-weight:800' : '');
      const dot = document.createElement('span');
      dot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${line.color};flex:none`;
      const name = document.createElement('span');
      name.textContent = `${i + 1}. ${line.name}`;
      name.style.cssText = 'flex:1;text-align:left';
      const score = document.createElement('span');
      score.textContent = `${line.countries} pays`;
      row.append(dot, name, score);
      this.endBody.appendChild(row);
    });
    const record = document.createElement('div');
    record.textContent = isRecord ? `Nouveau record : ${best} pays !` : `Ton record : ${best} pays`;
    record.style.cssText = 'margin-top:14px;opacity:.9';
    const again = document.createElement('div');
    again.textContent = 'Touche pour rejouer';
    again.style.cssText = 'margin-top:18px;font-weight:800;font-size:18px';
    this.endBody.append(record, again);
    this.endScreen.style.display = 'flex';
  }

  hideEnd(): void {
    this.endScreen.style.display = 'none';
  }

  hide(): void {
    window.clearTimeout(this.timer);
    this.box.style.opacity = '0';
  }
}
