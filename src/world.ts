import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification';
import atlas from 'world-atlas/countries-110m.json';

/** Un point en degrés : [longitude, latitude]. */
export type LonLat = [number, number];
/** Un polygone : contour extérieur puis trous éventuels. */
export type Polygon = LonLat[][];

export interface Country {
  /** Index dense, 0..n-1 : servira d'identifiant dans la grille de territoire. */
  index: number;
  /** Code ISO numérique de Natural Earth, quand il existe. */
  iso: string;
  name: string;
  polygons: Polygon[];
}

export interface World {
  countries: Country[];
  /** Frontières terrestres entre deux pays. */
  borders: LonLat[][];
  /** Côtes : arêtes qui n'appartiennent qu'à un seul pays. */
  coasts: LonLat[][];
}

interface CountryProps {
  name: string;
}

/** Charge le monde simplifié (Natural Earth 1:110m, domaine public). */
export function loadWorld(): World {
  const topology = atlas as unknown as Topology;
  const object = topology.objects['countries'] as GeometryCollection<CountryProps>;
  const collection = feature(topology, object);

  const countries: Country[] = [];
  for (const f of collection.features) {
    const g = f.geometry;
    let polygons: Polygon[];
    if (g.type === 'Polygon') polygons = [g.coordinates as Polygon];
    else if (g.type === 'MultiPolygon') polygons = g.coordinates as Polygon[];
    else continue;
    countries.push({
      index: countries.length,
      iso: f.id === undefined ? '' : String(f.id),
      name: f.properties.name,
      polygons,
    });
  }

  const borders = mesh(topology, object, (a: GeometryObject, b: GeometryObject) => a !== b)
    .coordinates as LonLat[][];
  const coasts = mesh(topology, object, (a: GeometryObject, b: GeometryObject) => a === b)
    .coordinates as LonLat[][];

  return { countries, borders, coasts };
}
