import './style.css';
import * as THREE from 'three';
import { OrbitCamera } from './camera';
import { config } from './config';
import { Input } from './input';
import { startLoop, type LoopStats } from './loop';
import { buildGlobe } from './render/globe';
import { loadWorld } from './world';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.backgroundColor);

const world = loadWorld();
const globe = buildGlobe(world);
scene.add(globe.group);

const orbit = new OrbitCamera();
const input = new Input(canvas);

// Éclairage doux de plateau : la lumière principale suit la caméra, la face visible est toujours éclairée.
scene.add(new THREE.HemisphereLight(config.skyLight, config.groundLight, config.hemiIntensity));
const sun = new THREE.DirectionalLight(0xffffff, config.sunIntensity);
sun.position.set(-0.6, 0.9, 1);
orbit.camera.add(sun);
orbit.camera.add(sun.target);
sun.target.position.set(0, 0, -1);
scene.add(orbit.camera);

// --- Redimensionnement et DPR ---
function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.maxDpr));
  renderer.setSize(w, h, false);
  orbit.resize(w, h);
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
    const panel = new DebugPanel(stats, renderer, orbit, world.countries.length, globe.triangles);
    onFrame = () => panel.frame();
  });
}

startLoop(
  (dt) => orbit.update(dt, input),
  (alpha) => {
    orbit.apply(alpha);
    renderer.render(scene, orbit.camera);
    onFrame?.();
  },
  stats,
);
