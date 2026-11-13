import * as THREE from 'three';
import { config } from '../config';
import type { Pawn } from '../pawn';

const DEG = Math.PI / 180;

/**
 * Figurine provisoire : un pion de jeu de société en bois peint, avec un petit museau qui
 * indique le sens de marche. Les animaux arrivent à l'étape 8.
 * Modélisé avec +Y vers le ciel et +Z vers l'avant, pour une taille de 1.
 */
function buildFigurine(): THREE.Group {
  const g = new THREE.Group();
  const paint = new THREE.MeshLambertMaterial({ color: config.pawnColor });
  const wood = new THREE.MeshLambertMaterial({ color: 0xf3e2c0 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.16, 20), paint);
  base.position.y = 0.08;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.4, 0.62, 20), paint);
  body.position.y = 0.47;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), paint);
  head.position.y = 0.95;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 12), wood);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.95, 0.32);
  g.add(base, body, head, nose);
  return g;
}

export class PawnView {
  readonly group = new THREE.Group();
  private readonly figurine = buildFigurine();
  private readonly shadow: THREE.Mesh;

  private readonly pos = new THREE.Vector3();
  private readonly heading = new THREE.Vector3();
  private readonly side = new THREE.Vector3();
  private readonly basis = new THREE.Matrix4();

  constructor() {
    // Ombre de contact : simple disque sombre posé au sol.
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.01;
    this.group.add(this.shadow, this.figurine);
    this.group.matrixAutoUpdate = false;
  }

  update(pawn: Pawn, alpha: number): void {
    this.pos.lerpVectors(pawn.prevPos, pawn.pos, alpha).normalize();
    this.heading.lerpVectors(pawn.prevHeading, pawn.heading, alpha);
    this.heading.addScaledVector(this.pos, -this.heading.dot(this.pos)).normalize();
    // Repère local : X = côté, Y = ciel, Z = avant.
    this.side.crossVectors(this.pos, this.heading);

    const s = config.pawnSizeDeg * DEG;
    const r = 1 + config.landHeight;
    this.basis.makeBasis(this.side, this.pos, this.heading);
    this.group.matrix.copy(this.basis).scale(this.side.set(s, s, s));
    this.group.matrix.setPosition(this.pos.x * r, this.pos.y * r, this.pos.z * r);
    this.group.matrixWorldNeedsUpdate = true;
  }
}
