/**
 * Tous les paramètres réglables du jeu.
 * Unités : globe de rayon 1, angles en degrés, temps en secondes.
 */
export const config = {
  // --- Boucle ---
  fixedDt: 1 / 120,
  maxFrameTime: 0.1,
  maxDpr: 2,

  // --- Globe plateau ---
  /** Épaisseur des terres au-dessus de la mer (en rayons). */
  landHeight: 0.012,
  /** Longueur max d'une arête de triangle avant subdivision (suit la courbure). */
  maxEdgeDeg: 3,
  seaSegments: 96,
  seaColor: 0x4f8f9c,
  /** Teintes « carton » des pays neutres : une par pays, tirée de façon stable. */
  neutralColors: [0xe8d3ae, 0xdfc79d, 0xf0ddba, 0xd6bd92, 0xe3cca3],
  landSideColor: 0x9c7f58,
  borderColor: 0x6b5236,
  coastColor: 0x5a4630,
  backgroundColor: 0x3a2c22,

  // --- Éclairage ---
  skyLight: 0xfff6e8,
  groundLight: 0x8a7a6a,
  hemiIntensity: 1.5,
  sunIntensity: 1.6,

  // --- Caméra ---
  fovDeg: 40,
  /** Vue globe (menu) : part de la plus petite dimension d'écran occupée par le globe. */
  globeFill: 0.86,
  /** Vue jeu : hauteur de la caméra au-dessus du sol (en rayons) — spec §4 `cameraDistance`. */
  cameraDistance: 0.6,
  /** Vitesse de transition entre vue globe et vue jeu (1/s). */
  zoomRate: 4,

  // --- Rotation libre du globe (menus uniquement) ---
  /** Décroissance de l'inertie après le lâcher (1/s). */
  orbitDamping: 2.5,
  /** Vitesse angulaire max conservée au lâcher (°/s). */
  orbitMaxSpeed: 360,
  /** Rotation lente quand on ne touche à rien (°/s). */
  idleSpinDeg: 4,
};
