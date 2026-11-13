import './style.css';
import * as THREE from 'three';
import { OrbitCamera } from './camera';
import { config } from './config';
import { countryNames } from './country-names';
import { dirToCell } from './cube-grid';
import { FollowCamera } from './follow-camera';
import { Game, HUMAN } from './game';
import { Hud } from './hud';
import { Input } from './input';
import { startLoop, type LoopStats } from './loop';
import { buildGlobe } from './render/globe';
import { Minimap } from './render/minimap';
import { PawnView } from './render/pawn-view';
import { ShareLabels } from './render/share-labels';
import { FootprintsView, TerritoryView } from './render/territory-view';
import { SEA, Territory } from './territory';
import { loadWorld } from './world';

const BEST_KEY = 'furritory.best';

function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Stockage indisponible (navigation privée) : le record ne sera pas gardé.
  }
}

/** Couleur d'empreinte : la couleur du joueur, assombrie. */
function darker(color: number): number {
  return new THREE.Color(color).multiplyScalar(0.5).getHex();
}

async function start(): Promise<void> {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.backgroundColor);

  // Grille « case → pays », précalculée par scripts/build-grid.ts.
  const response = await fetch(`${import.meta.env.BASE_URL}world-grid.bin`);
  if (!response.ok) throw new Error(`world-grid.bin : ${response.status}`);
  const territory = new Territory(new Uint8Array(await response.arrayBuffer()));
  const territoryView = new TerritoryView(territory);

  const world = loadWorld();
  const globe = buildGlobe(world, territoryView.landMaterial);
  scene.add(globe.group);

  const camera = new THREE.PerspectiveCamera(config.fovDeg, 1, 0.02, 20);
  const orbit = new OrbitCamera(camera);
  const follow = new FollowCamera(camera);
  const input = new Input(canvas);

  const game = new Game(territory, input);
  const human = game.human;
  const views = game.players.map((p) => {
    const pawnView = new PawnView(p.color);
    const footprints = new FootprintsView(darker(p.color));
    scene.add(footprints.mesh, pawnView.group);
    return { player: p, pawnView, footprints };
  });

  // Fondu rouge plein écran à la mort.
  const deathFlash = document.createElement('div');
  deathFlash.style.cssText =
    'position:fixed;inset:0;background:#b3261e;opacity:0;pointer-events:none;z-index:5';
  document.body.appendChild(deathFlash);
  let deathFlashLevel = 0;

  const hud = new Hud();
  const labels = new ShareLabels(territory, HUMAN);
  const minimap = new Minimap(territory, game.players);
  /** La consigne « reviens dans ta zone » n'est plus rappelée après une première capture. */
  let hasCaptured = false;
  /** La règle des 50 % est expliquée une fois, au premier pays entamé. */
  let flipRuleShown = false;
  /** Instant de la fin de partie : on attend un peu avant d'accepter « rejouer ». */
  let endedAt = 0;

  // Pays sous le pion : rafraîchi seulement quand il change.
  let hudCell = -1;
  function refreshCountry(force = false): void {
    const p = human.pawn.pos;
    const cell = dirToCell(territory.n, p.x, p.y, p.z);
    if (!force && cell === hudCell) return;
    hudCell = cell;
    const country = territory.country[cell] ?? SEA;
    hud.setCountry(country === SEA ? '' : (countryNames[country] ?? ''));
  }
  let shownSecond = -1;
  function refreshScore(): void {
    shownSecond = Math.ceil(game.timeLeft);
    hud.setScore(territory.countriesOwned(HUMAN), game.timeLeft);
  }

  /** « A », « A et B », « A, B et C », ou un simple compte au-delà. */
  function flipMessage(flips: readonly number[]): string {
    const names = flips.map((c) => countryNames[c] ?? '?');
    if (names.length === 1) return `${names[0]} bascule !`;
    if (names.length > 3) return `${names.length} pays basculent !`;
    return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]} basculent !`;
  }

  function nameOf(id: number): string {
    return game.players[id - 1]?.name ?? '?';
  }

  /** Traduit les événements de la partie en messages et en effets. */
  function handleEvents(): void {
    if (game.events.length === 0) return;
    let territoryChanged = false;
    for (const event of game.events) {
      if (event.type === 'trail') {
        if (event.player === HUMAN && !hasCaptured) hud.show('Reviens dans ta zone pour fermer la boucle', true);
      } else if (event.type === 'capture') {
        territoryChanged = true;
        if (event.player !== HUMAN) continue;
        territoryView.flash();
        const plus = event.gainedCountries > 0 ? ` +${event.gainedCountries} pays` : '';
        if (event.gainedCells > 0) hasCaptured = true;
        if (event.flips.length > 0) {
          territoryView.flashCountries(event.flips);
          hud.show(flipMessage(event.flips) + plus);
        } else if (event.gainedCountries > 0) {
          hud.show(`Conquis !${plus}`);
        } else if (!flipRuleShown && event.gainedCells > 0) {
          flipRuleShown = true;
          hud.show(`À ${Math.round(config.flipThreshold * 100)} %, le pays bascule en entier`);
        } else {
          hud.show(event.gainedCells > 0 ? 'Zone capturée !' : 'Boucle fermée');
        }
      } else if (event.type === 'death') {
        territoryChanged = true;
        if (event.player === HUMAN) {
          deathFlashLevel = 1;
          hasCaptured = false;
          hud.show(
            event.by === HUMAN ? 'Tu as coupé ta propre traînée' : `${nameOf(event.by)} a coupé ta traînée !`,
          );
        } else if (event.by === HUMAN) {
          hud.show(`Tu as éliminé ${nameOf(event.player)} !`);
        }
      } else if (event.type === 'respawn') {
        territoryChanged = true;
      } else if (event.type === 'end') {
        const countries = territory.countriesOwned(HUMAN);
        const previous = loadBest();
        const isRecord = countries > previous;
        if (isRecord) saveBest(countries);
        hud.hide();
        hud.showEnd(
          game.ranking().map((r) => ({
            name: r.player.name,
            color: `#${r.player.color.toString(16).padStart(6, '0')}`,
            countries: r.countries,
            me: r.player.id === HUMAN,
          })),
          Math.max(previous, countries),
          isRecord,
        );
        endedAt = performance.now();
      }
    }
    game.events.length = 0;
    if (territoryChanged) {
      refreshScore();
      labels.refresh();
    }
  }
  handleEvents();
  refreshScore();
  refreshCountry(true);

  // Écran de fin : une touche relance une partie (après un court délai, pour éviter un appui involontaire).
  canvas.addEventListener('pointerdown', () => {
    if (!game.over || performance.now() - endedAt < 800) return;
    game.restart();
    hud.hideEnd();
    hasCaptured = false;
    for (const v of views) v.footprints.clear();
    handleEvents();
    refreshScore();
    refreshCountry(true);
  });

  /** État de l'application. `globeView` : rotation libre du globe (menus, debug), jeu en pause. */
  const app = { globeView: false };

  // Éclairage doux de plateau : la lumière principale suit la caméra, la face visible est toujours éclairée.
  scene.add(new THREE.HemisphereLight(config.skyLight, config.groundLight, config.hemiIntensity));
  const sun = new THREE.DirectionalLight(0xffffff, config.sunIntensity);
  sun.position.set(-0.6, 0.9, 1);
  camera.add(sun);
  camera.add(sun.target);
  sun.target.position.set(0, 0, -1);
  scene.add(camera);

  // --- Redimensionnement et DPR ---
  function resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Résolution de rendu bornée par le DPR et par un budget total de pixels.
    const budget = Math.sqrt((config.maxRenderMegapixels * 1e6) / (w * h));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.maxDpr, budget));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    orbit.resize(h);
  }
  resize();
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  // Safari met parfois à jour innerWidth/innerHeight après l'événement : on revérifie.
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  // --- Debug (?debug=1), chargé uniquement à la demande ---
  const stats: LoopStats = { stepsLastFrame: 0, frameTime: 0, measure: false, updateMs: 0, renderMs: 0 };
  let onFrame: (() => void) | null = null;
  if (new URLSearchParams(location.search).get('debug') === '1') {
    void import('./debug').then(({ DebugPanel }) => {
      const panel = new DebugPanel(
        stats,
        renderer,
        app,
        human.pawn,
        territory,
        world.countries.length,
        globe.triangles,
      );
      onFrame = () => panel.frame();
      Object.assign(window, { pawn: human.pawn, config, territory, countryNames, game });
    });
  }

  function update(dt: number): void {
    if (app.globeView) {
      orbit.update(dt, input);
      return;
    }
    game.update(dt);
    for (const v of views) {
      const trailing = v.player.alive && territory.trailLength(v.player.id) > 0;
      if (trailing) v.footprints.record(v.player.pawn);
      else if (v.footprints.hasPrints) v.footprints.clear();
    }
    handleEvents();
    refreshCountry();
    if (Math.ceil(game.timeLeft) !== shownSecond) refreshScore();
  }

  function render(alpha: number): void {
    if (camera.fov !== config.fovDeg) {
      camera.fov = config.fovDeg;
      camera.updateProjectionMatrix();
    }
    // Partie finie ou pion mort : plus d'interpolation, le pion est figé.
    const a = game.over ? 1 : alpha;
    if (app.globeView) orbit.apply(alpha);
    else follow.apply(human.pawn, human.alive ? a : 1);
    for (const v of views) {
      v.pawnView.group.visible = v.player.alive;
      if (v.player.alive) v.pawnView.update(v.player.pawn, app.globeView ? 1 : a);
    }
    territoryView.update(stats.frameTime);
    if (deathFlashLevel > 0) {
      deathFlashLevel = Math.max(0, deathFlashLevel - stats.frameTime / config.deathFlashTime);
      deathFlash.style.opacity = String(deathFlashLevel * 0.6);
    }
    renderer.render(scene, camera);
    labels.update(camera, window.innerWidth, window.innerHeight);
    minimap.update(stats.frameTime);
    onFrame?.();
  }

  startLoop(update, render, stats);
}

void start();
