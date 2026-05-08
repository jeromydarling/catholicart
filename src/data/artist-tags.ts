// Layered metadata applied to each artist after-the-fact:
//   - saint tags (slugs from saints registry) — what saints they often depict
//   - diocese (full canonical name)
// Kept separate so the original artists.ts stays focused on identity.

import type { CategorySlug } from "../types";
import type { Saint } from "./saints";
import { saints } from "./saints";
import { artists } from "./artists";

export interface ArtistTags {
  saintSlugs: string[];   // saints they've depicted / specialize in
  diocese?: string;        // canonical diocese
  order?: string;          // religious-order slug (matches Order.slug below)
}

// Religious orders we group by. Slug + display name + short blurb.
export interface Order {
  slug: string;
  name: string;
  charism: string;
  paletteFrom: string;
  paletteTo: string;
}
export const ORDERS: Order[] = [
  {
    slug: "benedictine",
    name: "Order of St. Benedict",
    charism: "Ora et labora — pray and work. The grandfather of monastic art and chant.",
    paletteFrom: "#3a352c",
    paletteTo: "#0e0c08",
  },
  {
    slug: "franciscan",
    name: "Franciscans",
    charism: "Lady Poverty and the cosmic Christ. Workshops of the people.",
    paletteFrom: "#7a5320",
    paletteTo: "#33240f",
  },
  {
    slug: "dominican",
    name: "Order of Preachers (Dominicans)",
    charism: "Truth in the streets. The white-and-black habit and the studied hand.",
    paletteFrom: "#3a3a3a",
    paletteTo: "#0a0a0a",
  },
  {
    slug: "discalced-carmelite",
    name: "Discalced Carmelites",
    charism: "Hidden contemplation, dazzling output. Teresa, John of the Cross, Thérèse.",
    paletteFrom: "#5a4636",
    paletteTo: "#231914",
  },
];

export function orderBySlug(slug: string): Order | undefined {
  return ORDERS.find((o) => o.slug === slug);
}

export const ARTIST_TAGS: Record<string, ArtistTags> = {
  "maria-chrysostom":      { saintSlugs: ["mary", "joseph", "therese"],          diocese: "Diocese of Pittsburgh" },
  "br-andrew-of-subiaco":  { saintSlugs: ["francis", "anthony", "padre-pio"],    diocese: "Archdiocese of Santa Fe", order: "benedictine" },
  "giovanna-solis":        { saintSlugs: ["mary", "guadalupe", "kolbe"],         diocese: "Archdiocese of Mexico" },
  "tobias-wren":           { saintSlugs: ["joseph", "michael", "patrick"],       diocese: "Diocese of Cleveland" },
  "annunciata-park":       { saintSlugs: ["mary", "guadalupe", "faustina"],      diocese: "Diocese of Pittsburgh" },
  "felix-donnegan":        { saintSlugs: ["michael", "augustine", "jpii"],       diocese: "Diocese of Charleston" },
  "bartolomeu-camara":     { saintSlugs: ["mary", "francis", "anthony"],         diocese: "Archdiocese of São Paulo", order: "franciscan" },
  "sr-clare-of-avila":     { saintSlugs: ["catherine-siena", "therese", "mary"], diocese: "Archdiocese of Madrid", order: "discalced-carmelite" },
  "henrik-aslaksen":       { saintSlugs: ["michael", "patrick", "augustine"],    diocese: "Diocese of Oslo" },
  "theo-marchand":         { saintSlugs: ["bernadette", "therese", "joseph"],    diocese: "Archdiocese of Paris", order: "dominican" },
  "imogen-fairbairn":      { saintSlugs: ["cecilia", "therese", "mary"],         diocese: "Archdiocese of Westminster" },
  "esteban-vega-cruz":     { saintSlugs: ["guadalupe", "kolbe", "padre-pio"],    diocese: "Archdiocese of Mexico", order: "franciscan" },
};

export function tagsFor(artistSlug: string): ArtistTags {
  return ARTIST_TAGS[artistSlug] ?? { saintSlugs: [], diocese: undefined };
}

// Cathedral-or-chancery coordinates for each diocese. Hand-picked so the
// Mapbox map shows pins at the canonical episcopal seat.
export const DIOCESE_COORDS: Record<string, [number, number]> = {
  "Diocese of Pittsburgh":      [-79.9959, 40.4406],
  "Archdiocese of Santa Fe":    [-105.9378, 35.6870],
  "Archdiocese of Mexico":      [-99.1332, 19.4326],
  "Diocese of Cleveland":       [-81.6944, 41.4993],
  "Diocese of Charleston":      [-79.9311, 32.7765],
  "Archdiocese of São Paulo":   [-46.6333, -23.5505],
  "Archdiocese of Madrid":      [-3.7038, 40.4168],
  "Diocese of Oslo":            [10.7522, 59.9139],
  "Archdiocese of Paris":       [2.3522, 48.8566],
  "Archdiocese of Westminster": [-0.1248, 51.4994],
};

export function coordsFor(diocese: string): [number, number] | undefined {
  return DIOCESE_COORDS[diocese];
}

export function artistsBySaint(saintSlug: string) {
  return artists.filter((a) => tagsFor(a.slug).saintSlugs.includes(saintSlug));
}

export function artistsByDiocese(diocese: string) {
  return artists.filter((a) => tagsFor(a.slug).diocese === diocese);
}

export function artistsByOrder(orderSlug: string) {
  return artists.filter((a) => tagsFor(a.slug).order === orderSlug);
}

export function listDioceses(): { diocese: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of artists) {
    const d = tagsFor(a.slug).diocese;
    if (!d) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([diocese, count]) => ({ diocese, count }))
    .sort((a, b) => a.diocese.localeCompare(b.diocese));
}

// Suggest saints to feature on the homepage given the current month.
export function saintsThisMonth(date: Date = new Date()): Saint[] {
  const month = date.getMonth() + 1;
  return saints.filter((s) => s.feastMonth === month);
}

// Recommend artists for a given saint slug, gracefully falling back
// to artists who often depict similar themes (by category).
export function recommendArtistsForSaint(saintSlug: string, fallbackCategories: CategorySlug[] = ["sacred-painting", "iconography", "sculpture"]) {
  const direct = artistsBySaint(saintSlug);
  if (direct.length >= 3) return direct;
  const seen = new Set(direct.map((a) => a.slug));
  const fill = artists.filter(
    (a) => !seen.has(a.slug) && a.categories.some((c) => fallbackCategories.includes(c)),
  );
  return [...direct, ...fill].slice(0, 6);
}
