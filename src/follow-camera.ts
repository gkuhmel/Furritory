import * as THREE from 'three';
import { config } from './config';
import type { Pawn } from './pawn';

const DEG = Math.PI / 180;

/**
 * Caméra de jeu : verrouillée sur le pion, qui reste au centre de l'écran.
 * Elle ne pivote pas avec le pion : son « haut » est le repère écran transporté par le pion.
 */
export class FollowCamera {
  private readonly pos = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly offset = new THREE.Vector3();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  /** Distance caméra → pion pour voir `viewSpanDeg` d'arc sur la plus petite dimension. */
  private distance(): number {
    const halfV = (config.fovDeg * DEG) / 2;
    const halfMin = Math.atan(Math.tan(halfV) * Math.min(1, this.camera.aspect));
    return (config.viewSpanDeg * DEG) / 2 / Math.tan(halfMin);
  }

  apply(pawn: Pawn, alpha: number): void {
    this.pos.lerpVectors(pawn.prevPos, pawn.pos, alpha).normalize();
    this.up.lerpVectors(pawn.prevUp, pawn.up, alpha);
    this.up.addScaledVector(this.pos, -this.up.dot(this.pos)).normalize();

    const tilt = config.cameraTiltDeg * DEG;
    this.target.copy(this.pos).multiplyScalar(1 + config.landHeight);
    // Recul vers le bas de l'écran et prise de hauteur, selon l'inclinaison.
    this.offset
      .copy(this.pos)
      .multiplyScalar(Math.cos(tilt))
      .addScaledVector(this.up, -Math.sin(tilt))
      .multiplyScalar(this.distance());

    this.camera.position.copy(this.target).add(this.offset);
    this.camera.up.copy(this.up);
    this.camera.lookAt(this.target);
  }
}
