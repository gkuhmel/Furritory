import * as THREE from 'three';
import { config } from './config';

const DEG = Math.PI / 180;

/**
 * Un pion sur le globe.
 * - `pos` : position (vecteur unitaire) ;
 * - `heading` : direction de marche, tangente au globe ;
 * - `up` : direction du « haut de l'écran » au sol, tangente au globe. Elle est transportée
 *   parallèlement le long du trajet : aucun nord imposé, donc aucun à-coup aux pôles, et
 *   « droite à l'écran » garde le même sens pendant tout un virage.
 */
export class Pawn {
  readonly pos = new THREE.Vector3();
  readonly heading = new THREE.Vector3();
  readonly up = new THREE.Vector3();
  readonly prevPos = new THREE.Vector3();
  readonly prevHeading = new THREE.Vector3();
  readonly prevUp = new THREE.Vector3();

  /** Cap visé, en direction d'écran (y vers le bas). */
  private wantX = 0;
  private wantY = -1;

  private readonly axis = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly want = new THREE.Vector3();
  private readonly cross = new THREE.Vector3();

  constructor(lonDeg: number, latDeg: number) {
    this.reset(lonDeg, latDeg);
  }

  /** Replace le pion à un point de départ, cap et haut de l'écran vers le nord. */
  reset(lonDeg: number, latDeg: number): void {
    const phi = latDeg * DEG;
    const lambda = lonDeg * DEG;
    this.pos.set(Math.cos(phi) * Math.sin(lambda), Math.sin(phi), Math.cos(phi) * Math.cos(lambda));
    this.up.set(0, 1, 0).addScaledVector(this.pos, -this.pos.y).normalize();
    this.heading.copy(this.up);
    this.wantX = 0;
    this.wantY = -1;
    this.savePrev();
  }

  /** Donne un nouveau cap, en direction d'écran normalisée. */
  steer(dirX: number, dirY: number): void {
    this.wantX = dirX;
    this.wantY = dirY;
  }

  update(dt: number): void {
    this.savePrev();

    // Cap visé dans le monde : droite de l'écran = up × normale.
    this.right.crossVectors(this.up, this.pos);
    this.want.copy(this.right).multiplyScalar(this.wantX).addScaledVector(this.up, -this.wantY);

    // Virage vers le cap visé, à vitesse angulaire bornée.
    const cos = THREE.MathUtils.clamp(this.heading.dot(this.want), -1, 1);
    const sin = this.cross.crossVectors(this.heading, this.want).dot(this.pos);
    const angle = Math.atan2(sin, cos);
    const maxTurn = config.turnRate * DEG * dt;
    this.heading.applyAxisAngle(this.pos, THREE.MathUtils.clamp(angle, -maxTurn, maxTurn));

    // Avance le long du grand cercle : la même rotation transporte position, cap et repère écran.
    this.axis.crossVectors(this.pos, this.heading).normalize();
    const step = config.pawnSpeed * DEG * dt;
    this.pos.applyAxisAngle(this.axis, step).normalize();
    this.heading.applyAxisAngle(this.axis, step);
    this.up.applyAxisAngle(this.axis, step);

    // Corrige la dérive numérique : les deux directions restent tangentes et unitaires.
    this.heading.addScaledVector(this.pos, -this.heading.dot(this.pos)).normalize();
    this.up.addScaledVector(this.pos, -this.up.dot(this.pos)).normalize();
  }

  private savePrev(): void {
    this.prevPos.copy(this.pos);
    this.prevHeading.copy(this.heading);
    this.prevUp.copy(this.up);
  }
}
