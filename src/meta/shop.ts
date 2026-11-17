// Catalogue de la boutique (100 % esthétique) et achats.
import { S, saveS, type Category } from '../save';

export interface ShopItem { id: string; n: string; p: number }

export const SHOP: Record<Category, { n: string; items: ShopItem[] }> = {
  hat: { n: 'Chapeaux', items: [{ id: 'none', n: 'Aucun', p: 0 }, { id: 'cone', n: 'Chapeau de riz', p: 30 }, { id: 'band', n: 'Bandeau kung-fu', p: 45 }, { id: 'flower', n: 'Couronne de fleurs', p: 70 }, { id: 'mandarin', n: 'Chapeau de mandarin', p: 140 }, { id: 'horns', n: 'Cornes de dragon', p: 220 }] },
  scarf: { n: 'Écharpes', items: [{ id: 'gold', n: 'Or', p: 0 }, { id: 'red', n: 'Rouge', p: 20 }, { id: 'jade', n: 'Jade', p: 20 }, { id: 'night', n: 'Nuit', p: 35 }, { id: 'rainbow', n: 'Arc-en-ciel', p: 120 }] },
  glasses: { n: 'Lunettes', items: [{ id: 'none', n: 'Aucune', p: 0 }, { id: 'round', n: 'Rondes', p: 35 }, { id: 'sun', n: 'De soleil', p: 60 }, { id: 'mono', n: 'Monocle', p: 90 }] },
  wings: { n: 'Ailes', items: [{ id: 'leaf', n: 'Feuilles', p: 0 }, { id: 'lotus', n: 'Lotus', p: 70 }, { id: 'fan', n: 'Éventail', p: 110 }, { id: 'kite', n: 'Cerf-volant', p: 150 }, { id: 'phoenix', n: 'Phénix', p: 260 }] },
  trail: { n: 'Traînées', items: [{ id: 'none', n: 'Aucune', p: 0 }, { id: 'petals', n: 'Pétales', p: 40 }, { id: 'sparks', n: 'Étincelles', p: 80 }, { id: 'ink', n: 'Encre', p: 100 }, { id: 'rainbow', n: 'Arc-en-ciel', p: 160 }] },
};

export const isOwned = (cat: Category, id: string): boolean => S.owned.includes(cat + ':' + id);
export const findItem = (cat: Category, id: string): ShopItem | undefined => SHOP[cat].items.find(i => i.id === id);

export function equip(cat: Category, id: string): void {
  S.eq[cat] = id; saveS();
}

// Achète et équipe ; renvoie false si impossible.
export function buy(cat: Category, id: string): boolean {
  const it = findItem(cat, id);
  if (!it || S.bao < it.p) return false;
  S.bao -= it.p; S.owned.push(cat + ':' + it.id); S.eq[cat] = it.id; saveS();
  return true;
}
