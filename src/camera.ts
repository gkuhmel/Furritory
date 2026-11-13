import * as THREE from 'three';
import { config } from './config';
import type { Input } from './input';

const DEG = Math.PI / 180;
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

/**
 * Caméra en orbite autour du globe (vue menu) : le doigt fait tourner le globe, avec inertie.
 * L'orientation est un quaternion, sans nord imposé : aucun blocage aux pôles.
 * En partie, c'est `FollowCamera` qui prend le relais.
 */
export class OrbitCamera {

  private readonly orientation = new THREE.Quaternion();
  private readonly prevOrientation = new THREE.Quaternion();
  private distance = 4;
  private prevDistance = 4;
  private viewportH = 1;
  /** Vitesse angulaire (rad/s) autour des axes locaux X et Y de la caméra. */
  private velX = 0;
  private velY = 0;

  private readonly drag = { x: 0, y: 0 };
  private readonly tmpQ = new THREE.Quaternion();
  private readonly renderQ = new THREE.Quaternion();

  constructor(private readonly camera: THREE.PerspectiveCamera) {
    // Départ centré sur l'Europe et l'Afrique, légèrement vu du nord.
    this.orientation.setFromEuler(new THREE.Euler(-20 * DEG, 15 * DEG, 0, 'YXZ'));
    this.prevOrientation.copy(this.orientation);
    this.distance = this.prevDistance = this.targetDistance();
  }

  resize(h: number): void {
    this.viewportH = h;
    this.distance = this.prevDistance = this.targetDistance();
  }

  /** Distance au centre pour la vue courante. */
  private targetDistance(): number {
    // Le globe doit occuper `globeFill` de la plus petite dimension de l'écran.
    const halfV = (config.fovDeg * DEG) / 2;
    const halfMin = Math.atan(Math.tan(halfV) * Math.min(1, this.camera.aspect));
    return 1 / Math.sin(halfMin * config.globeFill);
  }

  update(dt: number, input: Input): void {
    this.prevOrientation.copy(this.orientation);
    this.prevDistance = this.distance;

    // Angle par pixel tel que la surface du globe suive le doigt au centre de l'écran.
    const halfV = (config.fovDeg * DEG) / 2;
    const radPerPx = (2 * (this.distance - 1) * Math.tan(halfV)) / this.viewportH;

    input.consumeDrag(this.drag);
    if (input.down) {
      const ax = -this.drag.y * radPerPx;
      const ay = -this.drag.x * radPerPx;
      this.rotate(ax, ay);
      // Vitesse lissée, conservée comme inertie au lâcher.
      const blend = Math.min(1, dt * 30);
      this.velX += (ax / dt - this.velX) * blend;
      this.velY += (ay / dt - this.velY) * blend;
      const max = config.orbitMaxSpeed * DEG;
      this.velX = Math.max(-max, Math.min(max, this.velX));
      this.velY = Math.max(-max, Math.min(max, this.velY));
    } else {
      const decay = Math.exp(-config.orbitDamping * dt);
      this.velX *= decay;
      this.velY *= decay;
      // L'inertie s'éteint vers une rotation lente de présentation.
      const idle = config.idleSpinDeg * DEG;
      this.rotate(this.velX * dt, (this.velY + idle * (1 - Math.min(1, Math.abs(this.velY)))) * dt);
    }
  }

  private rotate(ax: number, ay: number): void {
    this.orientation.multiply(this.tmpQ.setFromAxisAngle(AXIS_Y, ay));
    this.orientation.multiply(this.tmpQ.setFromAxisAngle(AXIS_X, ax));
    this.orientation.normalize();
  }

  /** Place la caméra pour le rendu, interpolée entre les deux derniers pas de simulation. */
  apply(alpha: number): void {
    this.renderQ.slerpQuaternions(this.prevOrientation, this.orientation, alpha);
    const d = this.prevDistance + (this.distance - this.prevDistance) * alpha;
    this.camera.up.set(0, 1, 0).applyQuaternion(this.renderQ);
    this.camera.position.set(0, 0, d).applyQuaternion(this.renderQ);
    this.camera.lookAt(0, 0, 0);
  }
}
