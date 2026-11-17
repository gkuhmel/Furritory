// Thèmes des mondes : palette, décor et habillage des obstacles.
export type PillarSkin = 'bamboo' | 'pole' | 'temple' | 'ice' | 'jade';
export type FlyerSkin = 'crane' | 'kite' | 'rocket' | 'snowball' | 'stormcloud';
export type ColumnSkin = 'waterfall' | 'irrigation' | 'smoke' | 'avalanche' | 'wind';
export type BarSkin = 'bridge' | 'reeds' | 'garland' | 'icicles' | 'lightning';
export type FarSkin = 'bamboo' | 'terraces' | 'roofs' | 'pines' | 'clouds';

export interface Theme {
  name: string;
  pal: number; // indice de palette (SEASONS)
  pillar: PillarSkin; flyer: FlyerSkin; column: ColumnSkin; bar: BarSkin; far: FarSkin;
  pillarName: string; flyerName: string; columnName: string; barName: string;
  node: string; // couleur des médaillons de la carte
  map: [string, string]; // dégradé de fond de la carte
}

export const THEMES: Theme[] = [
  { name: 'Forêt de bambous', pal: 0, pillar: 'bamboo', flyer: 'crane', column: 'waterfall', bar: 'bridge', far: 'bamboo',
    pillarName: 'bambous', flyerName: 'Grues', columnName: 'Cascades', barName: 'Ponts de corde',
    node: '#56b544', map: ['#5fb59a', '#ffc4a0'] },
  { name: 'Rizières au crépuscule', pal: 1, pillar: 'pole', flyer: 'kite', column: 'irrigation', bar: 'reeds', far: 'terraces',
    pillarName: 'poteaux', flyerName: 'Cerfs-volants', columnName: 'Canaux d’irrigation', barName: 'Cordes à épouvantails',
    node: '#7a4fa0', map: ['#2f6b5a', '#ff8a5c'] },
  { name: 'Ville des lanternes', pal: 2, pillar: 'temple', flyer: 'rocket', column: 'smoke', bar: 'garland', far: 'roofs',
    pillarName: 'piliers de temple', flyerName: 'Fusées de fête', columnName: 'Fumée d’encens', barName: 'Guirlandes de lanternes',
    node: '#e8343a', map: ['#b5652c', '#ffd59a'] },
  { name: 'Montagnes enneigées', pal: 3, pillar: 'ice', flyer: 'snowball', column: 'avalanche', bar: 'icicles', far: 'pines',
    pillarName: 'pics de glace', flyerName: 'Boules de neige', columnName: 'Avalanches', barName: 'Rideaux de stalactites',
    node: '#5aa0d0', map: ['#c8d8e8', '#8fb0e8'] },
  { name: 'Palais céleste', pal: 4, pillar: 'jade', flyer: 'stormcloud', column: 'wind', bar: 'lightning', far: 'clouds',
    pillarName: 'colonnes de jade', flyerName: 'Nuages d’orage', columnName: 'Souffles célestes', barName: 'Éclairs',
    node: '#d9a520', map: ['#b9a0e8', '#ffe7a8'] },
];
