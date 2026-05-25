// Jaccard-style similarity between artists for "similar artists" rows.
// Cheap, hand-rolled, good enough for ~50 artists.

import type { Artist } from "../types";
import { artists } from "../data/artists";
import { tagsFor } from "../data/artist-tags";

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  a.forEach((x) => {
    if (b.has(x)) inter++;
  });
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function priceBand(usd: number): number {
  if (usd < 500) return 0;
  if (usd < 1500) return 1;
  if (usd < 3500) return 2;
  if (usd < 7500) return 3;
  return 4;
}

export function similarArtists(slug: string, n = 4): Artist[] {
  const source = artists.find((a) => a.slug === slug);
  if (!source) return [];
  const sourceCats = new Set(source.categories);
  const sourceTags = tagsFor(slug);
  const sourceSaints = new Set(sourceTags.saintSlugs);
  const sourcePriceBand = priceBand(source.startingAt);

  const scored = artists
    .filter((a) => a.slug !== slug)
    .map((a) => {
      const tags = tagsFor(a.slug);
      const catScore = jaccard(sourceCats, new Set(a.categories)) * 3;
      const saintScore = jaccard(sourceSaints, new Set(tags.saintSlugs)) * 2;
      const priceScore =
        priceBand(a.startingAt) === sourcePriceBand
          ? 1
          : Math.abs(priceBand(a.startingAt) - sourcePriceBand) <= 1
            ? 0.5
            : 0;
      const orderBonus =
        tags.order && tags.order === sourceTags.order ? 0.8 : 0;
      return {
        artist: a,
        score: catScore + saintScore + priceScore + orderBonus,
      };
    })
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score);

  return scored.slice(0, n).map((s) => s.artist);
}
