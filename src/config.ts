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
  fovDeg: 50,
  /** Vue globe (menu) : part de la plus petite dimension d'écran occupée par le globe. */
  globeFill: 0.86,
  /**
   * Vue jeu : arc de globe visible (degrés) sur la plus petite dimension de l'écran.
   * Fixe l'échelle ressentie du monde, identique sur téléphone et tablette.
   */
  viewSpanDeg: 12,
  /** Vue jeu : inclinaison de la caméra par rapport à la verticale du pion (degrés). */
  cameraTiltDeg: 30,

  // --- Rotation libre du globe (menus uniquement) ---
  /** Décroissance de l'inertie après le lâcher (1/s). */
  orbitDamping: 2.5,
  /** Vitesse angulaire max conservée au lâcher (°/s). */
  orbitMaxSpeed: 360,
  /** Rotation lente quand on ne touche à rien (°/s). */
  idleSpinDeg: 4,

  // --- Pion ---
  /** Vitesse de déplacement (°/s) : 4 = traversée de la France en 2 s, tour du monde en 90 s. */
  pawnSpeed: 4,
  /** Vitesse de virage (°/s) : 900 = angle droit en 0,1 s, un virage net sans être une téléportation. */
  turnRate: 900,
  /** Taille du pion (degrés d'arc). */
  pawnSizeDeg: 0.9,
  pawnColor: 0xd9482b,
  /** Départ : longitude, latitude (France). */
  startLon: 2.5,
  startLat: 46.5,

  // --- Contrôle au pouce (joystick invisible) ---
  /** Déplacement minimal du doigt avant de donner un cap (px CSS). */
  stickDeadzonePx: 6,
  /** Au-delà de ce rayon, l'ancre du joystick suit le doigt : un demi-tour reste rapide (px CSS). */
  stickRadiusPx: 14,

  // --- Territoire ---
  /** Couleur de zone par joueur (joueur 1 en premier). */
  playerColors: [0xe2572f, 0x3f7fd1, 0x49a35a, 0x9a59c4, 0xe0a81f, 0x2fb5b0],
  /** Nombre de dernières cases de traînée qu'on peut retoucher sans mourir. */
  trailGraceCells: 4,
  /** Durée de l'éclat de capture (s). */
  capturePulseTime: 0.45,
  /** Durée d'affichage d'un message en bas de l'écran (s). */
  hudMessageTime: 2.2,
  /** Durée du fondu rouge à la mort (s). */
  deathFlashTime: 0.6,

  // --- Empreintes de la traînée ---
  footprintSpacingDeg: 0.3,
  footprintSizeDeg: 0.24,
  /** Écart latéral gauche/droite des pattes (degrés). */
  footprintOffsetDeg: 0.09,
  footprintColor: 0x7a2412,
  footprintMax: 4000,
};
