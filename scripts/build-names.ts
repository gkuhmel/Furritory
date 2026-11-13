/**
 * Génère src/country-names.ts : le nom français de chaque pays, dans l'ordre de src/world.ts.
 * Usage : `npm run build:names` (à relancer seulement si la carte change).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const iso = require('i18n-iso-countries');
iso.registerLocale(require('i18n-iso-countries/langs/fr.json'));

/** Territoires sans code ISO dans Natural Earth, ou dont le nom officiel est trop long. */
const OVERRIDES: Record<string, string> = {
  Kosovo: 'Kosovo',
  'N. Cyprus': 'Chypre du Nord',
  Somaliland: 'Somaliland',
  'Dem. Rep. Congo': 'RD Congo',
  Congo: 'Congo',
  'Falkland Is.': 'Îles Malouines',
  'Fr. S. Antarctic Lands': 'Terres australes françaises',
  Palestine: 'Palestine',
  Antarctica: 'Antarctique',
  Tanzania: 'Tanzanie',
  'United States of America': 'États-Unis',
  Czechia: 'Tchéquie',
  'Central African Rep.': 'Centrafrique',
  'Dominican Rep.': 'République dominicaine',
  'United Arab Emirates': 'Émirats arabes unis',
};

const atlas = JSON.parse(
  readFileSync(new URL('../node_modules/world-atlas/countries-110m.json', import.meta.url), 'utf8'),
);
const collection = feature(atlas, atlas.objects.countries) as unknown as {
  features: { id?: string; geometry: { type: string }; properties: { name: string } }[];
};

const names: string[] = [];
const fallbacks: string[] = [];
for (const f of collection.features) {
  if (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon') continue;
  const english = f.properties.name;
  let name = OVERRIDES[english];
  if (!name && f.id !== undefined) name = iso.getName(String(f.id).padStart(3, '0'), 'fr', { select: 'alias' });
  if (!name) {
    name = english;
    fallbacks.push(english);
  }
  names.push(name);
}

writeFileSync(
  new URL('../src/country-names.ts', import.meta.url),
  `// Fichier généré par scripts/build-names.ts — ne pas modifier à la main.\n` +
    `/** Nom français de chaque pays, dans l'ordre des pays de src/world.ts. */\n` +
    `export const countryNames: readonly string[] = ${JSON.stringify(names, null, 2)};\n`,
);
console.log(`${names.length} noms écrits. Sans traduction : ${fallbacks.join(', ') || 'aucun'}.`);
