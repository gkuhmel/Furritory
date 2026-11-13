import './style.css';
import * as THREE from 'three';
import { OrbitCamera } from './camera';
import { config } from './config';
import { dirToCell } from './cube-grid';
import { FollowCamera } from './follow-camera';
import { Hud } from './hud';
import { Input } from './input';
import { startLoop, type LoopStats } from './loop';
import { Pawn } from './pawn';
import { buildGlobe } from './render/globe';
import { PawnView } from './render/pawn-view';
import { FootprintsView, TerritoryView } from './render/territory-view';
import { Territory } from './territory';
import { loadWorld } from './world';

/** Numéro du joueur humain dans la grille de territoire. */
const PLAYER = 1;

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

  const pawn = new Pawn(config.startLon, config.startLat);
  const pawnView = new PawnView();
  const footprints = new FootprintsView();
  scene.add(footprints.mesh, pawnView.group);

  const cellOf = (): number => dirToCell(territory.n, pawn.pos.x, pawn.pos.y, pawn.pos.z);
  territory.claimCountryAt(PLAYER, cellOf());

  // Fondu rouge plein écran à la mort.
  const deathFlash = document.createElement('div');
  deathFlash.style.cssText =
    'position:fixed;inset:0;background:#b3261e;opacity:0;pointer-events:none;z-index:5';
  document.body.appendChild(deathFlash);
  let deathFlashLevel = 0;
  const hud = new Hud();
  /** Vrai tant que la consigne « reviens dans ta zone » est affichée. */
  let trailHint = false;
  /** La consigne n'est plus rappelée une fois que le joueur a réussi une capture. */
  let hasCaptured = false;

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
        pawn,
        territory,
        world.countries.length,
        globe.triangles,
      );
      onFrame = () => panel.frame();
      Object.assign(window, { pawn, config, territory });
    });
  }

  function update(dt: number): void {
    if (app.globeView) {
      orbit.update(dt, input);
      return;
    }
    if (input.hasDir) pawn.steer(input.dirX, input.dirY);
    pawn.update(dt);

    const event = territory.step(PLAYER, cellOf());
    if (event === 'trail' && !trailHint && !hasCaptured) {
      // La règle de base : c'est le retour chez soi qui ferme la boucle.
      trailHint = true;
      hud.show('Reviens dans ta zone pour fermer la boucle', true);
    } else if (event === 'capture') {
      trailHint = false;
      footprints.clear();
      territoryView.flash();
      if (territory.lastGain > 0) hasCaptured = true;
      hud.show(territory.lastGain > 0 ? 'Zone capturée !' : 'Boucle fermée');
    } else if (event === 'death') {
      // Mort : on perd tout et on repart du pays de départ.
      trailHint = false;
      territory.wipe(PLAYER);
      footprints.clear();
      pawn.reset(config.startLon, config.startLat);
      input.resetDir();
      territory.claimCountryAt(PLAYER, cellOf());
      deathFlashLevel = 1;
      hasCaptured = false;
      hud.show('Tu as coupé ta propre traînée');
    }
    if (territory.trailLength > 0) footprints.record(pawn);
  }

  function render(alpha: number): void {
    if (camera.fov !== config.fovDeg) {
      camera.fov = config.fovDeg;
      camera.updateProjectionMatrix();
    }
    if (app.globeView) orbit.apply(alpha);
    else follow.apply(pawn, alpha);
    pawnView.update(pawn, app.globeView ? 1 : alpha);
    territoryView.update(stats.frameTime);
    if (deathFlashLevel > 0) {
      deathFlashLevel = Math.max(0, deathFlashLevel - stats.frameTime / config.deathFlashTime);
      deathFlash.style.opacity = String(deathFlashLevel * 0.6);
    }
    renderer.render(scene, camera);
    onFrame?.();
  }

  startLoop(update, render, stats);
}

void start();
