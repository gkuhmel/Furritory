import './style.css';
import * as THREE from 'three';
import { OrbitCamera } from './camera';
import { config } from './config';
import { FollowCamera } from './follow-camera';
import { Input } from './input';
import { startLoop, type LoopStats } from './loop';
import { Pawn } from './pawn';
import { buildGlobe } from './render/globe';
import { PawnView, TraceView } from './render/pawn-view';
import { loadWorld } from './world';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.backgroundColor);

const world = loadWorld();
const globe = buildGlobe(world);
scene.add(globe.group);

const camera = new THREE.PerspectiveCamera(config.fovDeg, 1, 0.02, 20);
const orbit = new OrbitCamera(camera);
const follow = new FollowCamera(camera);
const input = new Input(canvas);

const pawn = new Pawn(config.startLon, config.startLat);
const pawnView = new PawnView();
const trace = new TraceView();
scene.add(pawnView.group, trace.points);

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.maxDpr));
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
    const panel = new DebugPanel(stats, renderer, app, pawn, world.countries.length, globe.triangles);
    onFrame = () => panel.frame();
    Object.assign(window, { pawn, config });
  });
}

startLoop(
  (dt) => {
    if (app.globeView) {
      orbit.update(dt, input);
      return;
    }
    if (input.hasDir) pawn.steer(input.dirX, input.dirY);
    pawn.update(dt);
    trace.record(pawn);
  },
  (alpha) => {
    if (camera.fov !== config.fovDeg) {
      camera.fov = config.fovDeg;
      camera.updateProjectionMatrix();
    }
    if (app.globeView) orbit.apply(alpha);
    else follow.apply(pawn, alpha);
    pawnView.update(pawn, app.globeView ? 1 : alpha);
    renderer.render(scene, camera);
    onFrame?.();
  },
  stats,
);
