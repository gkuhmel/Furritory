// Toutes les constantes de réglage du jeu.
// Les valeurs reprennent exactement celles du prototype (prototype/index.html).

// ---------- Monde et affichage ----------
export const H = 640; // hauteur logique du monde
export const W_MIN = 320; // largeur logique minimale
export const W_MAX = 1000; // largeur logique maximale
export const DPR_MAX = 2; // densité de rendu plafonnée
export const DT_MAX = 0.033; // pas de temps maximal (s)
export const GROUND = H - 70; // altitude du sol
export const MENU_SCROLL = 40; // défilement du décor hors partie (px/s)
export const MENU_DIST_SPEED = 30; // avance de la distance au menu (px/s)
export const MENU_PANDA_Y = 0.475; // hauteur de Choco au menu (fraction de H)
export const MENU_PANDA_SCALE = 1.6; // Choco en grand au menu

// ---------- Panda ----------
export const PANDA_X = 0.28; // position horizontale (fraction de W)
export const PANDA_Y = 0.42; // position verticale de départ (fraction de H)
export const FLAP_VY = -430; // vitesse verticale d'un battement
export const DRAGON_FLAP_VY = -360; // battement à dos de dragon
export const START_VY = -420; // impulsion au lancement de la partie
export const GRAVITY = 1500;
export const DRAGON_GRAVITY = 900;
export const CEILING = 14; // plafond
export const FLOOR_OFFSET = 16; // distance sol / centre du panda
export const DRAGON_FLOOR_OFFSET = 40;
export const FLOOR_BOUNCE_VY = -420; // rebond au sol si invulnérable
export const SHIELD_BOUNCE_VY = -480; // rebond au sol avec bouclier
export const ROT_DIV = 700; // inclinaison = vy / ROT_DIV
export const ROT_MIN = -0.5;
export const ROT_MAX = 1.2;
export const WING_DECAY = 4;
export const HIT_HALF_W = 14; // demi-largeur de la boîte de collision
export const HIT_HALF_H = 12; // demi-hauteur de la boîte de collision
export const DEATH_FALL_GRAVITY = 1500;
export const DEATH_ROT_SPEED = 5;
export const DEATH_ROT_MAX = 1.6;

// ---------- Vitesse ----------
export const SPEED_BASE = 170;
export const SPEED_PER_POINT = 2.2;
export const SPEED_MAX = 300;
export const DASH_SPEED_MULT = 2.2;
export const DRAGON_SPEED_MULT = 1.8;

// ---------- Bambous ----------
export const GAP0 = 175; // trou de départ
export const GAP_MIN = 128;
export const GAP_SHRINK = 1.1; // rétrécissement par point
export const PIPE_W = 64;
export const SPACING = 240;
export const PIPE_MARGIN = 70; // marge haut/bas du centre du trou
export const SWAY_PER_POINT = 0.015; // part de bambous oscillants par point
export const SWAY_MAX_CHANCE = 0.45;
export const SWAY_AMP_MIN = 18;
export const SWAY_AMP_MAX = 40;
export const SWAY_FREQ = 1.6;
export const FORCE_SIDE_MARGIN = 28; // marge autour d'un pont pour la paire suivante

// ---------- Frôler / combo ----------
export const NEAR_DIST = 34;
export const PIXEL_DIST = 20;
export const COMBO_TIME = 2.5;
export const PIXEL_SLOW_TIME = 0.45;
export const PIXEL_SLOW_FACTOR = 0.3;

// ---------- Bonus ----------
export const BAO_CHANCE = 0.55; // bao dans un trou de bambous
export const LANTERN_CHANCE = 0.12; // seuils cumulés entre deux paires
export const CLOUD_CHANCE = 0.22;
export const PEACH_CHANCE = 0.31;
export const BAO_POINTS = 2;
export const DASH_TIME = 2.6;
export const PEACH_SLOW_TIME = 4;
export const PEACH_SLOW_FACTOR = 0.55;
export const MAGNET_TIME = 6;
export const MAGNET_RADIUS = 240;
export const MAGNET_SPEED = 460;
export const SHIELD_GHOST_TIME = 1.2; // invulnérabilité après bouclier brisé
export const PICKUP_RADIUS = 16; // ajouté au rayon de l'objet

// ---------- Dragon ----------
export const DRAGON_NEED = 12;
export const DRAGON_TIME = 5.5;
export const DRAGON_RAIN_INTERVAL = 0.13;
export const DRAGON_END_GHOST = 1;

// ---------- Obstacles ----------
export const CRANE_MIN_SCORE = 8;
export const CRANE_CHANCE = 0.2; // seuils cumulés
export const CASCADE_MIN_SCORE = 14;
export const CASCADE_CHANCE = 0.34;
export const BRIDGE_MIN_SCORE = 20;
export const BRIDGE_CHANCE = 0.46;
export const CRANE_SPEED = 70; // vitesse propre de la grue
export const CRANE_HIT = 22;
export const CASCADE_W = 44;
export const CASCADE_PUSH = 1400;
export const BRIDGE_LEN = 96;
export const BRIDGE_HIT = 16;
export const CONE_HIT = 20;
export const PROJECTILE_GRAVITY = 400;

// ---------- Singe farceur ----------
export const MONKEY_FIRST = 30;
export const MONKEY_EVERY = 45;
export const MONKEY_LIFE = 12;
export const MONKEY_FIRST_THROW = 1.6;
export const MONKEY_THROW_MIN = 0.9;
export const MONKEY_THROW_MAX = 1.3;
export const MONKEY_PEACH_CHANCE = 0.2;
export const MONKEY_BONUS = 10;
export const MONKEY_THROW_VX_MIN = 300;
export const MONKEY_THROW_VX_MAX = 380;
export const MONKEY_NEXT_PIPE = 80; // délai avant la paire suivante après le singe

// ---------- Événements ----------
export const EVENT_MIN_SCORE = 5;
export const EVENT_TIME = 7;
export const EVENT_FIRST_MIN = 16;
export const EVENT_FIRST_MAX = 24;
export const EVENT_GAP_MIN = 18;
export const EVENT_GAP_MAX = 28;
export const WIND_FORCE = 520;

// ---------- Saisons ----------
export const SEASON_EVERY = 25;
export const SEASON_FADE = 1.1; // vitesse du fondu des couleurs

// ---------- Missions / économie ----------
export const MULT_STEP = 0.25;
export const MULT_MAX = 5;

// ---------- Fantôme ----------
export const GHOST_STEP = 6; // px de distance entre deux enregistrements
export const GHOST_MAX = 9000;

// ---------- Fin de partie ----------
export const OVER_DELAY_MS = 950;
export const RESTART_KEY_DELAY = 0.9;

// ---------- Audio ----------
export const MASTER_VOLUME = 0.7;
export const TEMPO_BASE = 88;
export const TEMPO_PER_COMBO = 6;
export const TEMPO_COMBO_MAX = 8;
export const TEMPO_DRAGON = 34;
export const TEMPO_MONKEY = 10;
export const MUSIC_TICK_MS = 25;
export const MUSIC_LOOKAHEAD = 0.12;

// ---------- Sauvegarde ----------
export const SAVE_KEY = 'pandaRoux2';
export const SAVE_VERSION = 2;

// ---------- Aventure : mondes et niveaux ----------
export const WORLDS = 5;
export const LEVELS_PER_WORLD = 10;
export const LETTERS = ['C', 'H', 'O', 'C', 'O'];
export const LETTER_POS = [0.15, 0.35, 0.55, 0.72, 0.9]; // place des lettres dans le niveau (fraction)
export const LETTER_POINTS = 5;
export const STARS_2_LETTERS = 3; // lettres nécessaires pour 2 étoiles (5 pour 3 étoiles)
export const CHOCO_BAO_MULT = 2; // bonus des 5 lettres : bao du niveau ×2
export const WIN_DELAY_MS = 1300; // vol de sortie avant l'écran de victoire
export const LEVEL_BOSS_AT = 0.5; // le singe arrive à mi-niveau (dernier niveau de chaque monde)

export interface LevelDef {
  pairs: number; // nombre de passages avant l'arrivée
  gap: number; // hauteur du trou
  spacing: number; // distance entre deux passages
  speed: number; // vitesse de défilement
  sway: number; // part de passages qui oscillent
  swayAmp: number; // amplitude maximale d'oscillation
  swayFreq: number; // vitesse d'oscillation
  flyer: number; // probabilité d'un obstacle volant entre deux passages
  column: number; // probabilité d'une colonne qui pousse vers le bas
  bar: number; // probabilité d'une barre mortelle
  letterEdge: number; // décalage des lettres vers les bords du trou (0 = centre)
  events: boolean; // événements (vent, brume, fête) possibles
  boss: boolean; // le singe farceur s'invite
}

// Difficulté en dents de scie : monte dans un monde, redescend un peu au début du suivant.
export function levelDef(w: number, l: number): LevelDef {
  const k = Math.min(1, (w * 8 + l) / 41);
  return {
    pairs: Math.round(26 + k * 38),
    gap: Math.round(174 - k * 46),
    spacing: Math.round(250 - k * 45),
    speed: Math.round(165 + k * 95),
    sway: w === 0 && l < 1 ? 0 : Math.min(0.7, 0.08 + w * 0.12 + l * 0.03),
    swayAmp: 16 + k * 30,
    swayFreq: 1.3 + k * 1.1,
    flyer: l >= 2 ? 0.12 + 0.03 * w : 0,
    column: l >= 4 ? 0.08 + 0.02 * w : 0,
    bar: l >= 6 ? 0.08 + 0.02 * w : 0,
    letterEdge: Math.min(0.32, k * 0.4),
    events: w >= 1 && l >= 3,
    boss: l === LEVELS_PER_WORLD - 1,
  };
}
