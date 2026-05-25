// Client-side fuzzy match scoring for artists. Cheap and good enough
// for the prototype's 12–50 artist directory. Will be replaced by a
// Postgres `tsvector` query once Supabase is in.

import type { Artist } from "../types";
import { categoryBySlug } from "../data/categories";
import { saintBySlug } from "../data/saints";
import { tagsFor } from "../data/artist-tags";

export interface ScoredArtist {
  artist: Artist;
  score: number;
  matches: string[]; // for "matched: name, bio, …" hint
}

const STOP = new Set([
  "a", "an", "and", "or", "the", "of", "for", "to", "in", "on", "with",
  "my", "our", "i", "we", "is", "are", "was", "were",
]);

function normalize(s: string): string {
  return s.toLowerCase();
}

function tokens(s: string): string[] {
  return normalize(s)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

// Build a searchable index for an artist: weighted fields concatenated.
interface Indexed {
  weighted: { weight: number; text: string }[];
  haystack: string;
}

function indexArtist(a: Artist): Indexed {
  const tagInfo = tagsFor(a.slug);
  const saintNames = tagInfo.saintSlugs
    .map((s) => saintBySlug(s))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .flatMap((s) => [s.name, ...(s.also ?? [])])
    .join(" ");
  const catNames = a.categories
    .map((c) => categoryBySlug(c)?.name ?? c)
    .join(" ");
  const tierText = a.tiers.map((t) => `${t.name} ${t.description}`).join(" ");
  const bioText = Array.isArray(a.bio) ? a.bio.join(" ") : (a.bio ?? "");

  const weighted = [
    { weight: 6, text: a.name },
    { weight: 4, text: a.honorific ?? "" },
    { weight: 4, text: catNames },
    { weight: 3, text: saintNames },
    { weight: 3, text: tagInfo.diocese ?? "" },
    { weight: 2, text: `${a.city} ${a.region}` },
    { weight: 2, text: tierText },
    { weight: 1, text: bioText },
  ];

  return {
    weighted,
    haystack: weighted.map((w) => w.text).join(" ").toLowerCase(),
  };
}

const indexCache = new WeakMap<Artist, Indexed>();
function getIndex(a: Artist) {
  let idx = indexCache.get(a);
  if (!idx) {
    idx = indexArtist(a);
    indexCache.set(a, idx);
  }
  return idx;
}

// Score one artist against a query. Returns 0 if no match.
export function scoreArtist(a: Artist, query: string): { score: number; matches: string[] } {
  const q = query.trim();
  if (!q) return { score: 0, matches: [] };

  const idx = getIndex(a);

  // Whole-query substring bonus (handles "St. Joseph" as one phrase)
  let score = 0;
  const matches: Set<string> = new Set();
  const lowerQ = normalize(q);
  if (idx.haystack.includes(lowerQ)) score += 5;

  for (const tok of tokens(q)) {
    for (const field of idx.weighted) {
      if (!field.text) continue;
      const text = field.text.toLowerCase();
      if (text.includes(tok)) {
        // Boost if matches word boundary
        const isWord = new RegExp(`\\b${tok}`, "i").test(field.text);
        score += field.weight * (isWord ? 1.5 : 1);
        // Tag which field matched for the result hint
        if (field.weight >= 4) matches.add(matchLabel(field.text, a));
      }
    }
  }
  return { score, matches: [...matches].slice(0, 3) };
}

function matchLabel(text: string, a: Artist): string {
  if (text === a.name) return "name";
  if (text === a.honorific) return "honorific";
  return "match";
}

export function searchArtists(artists: Artist[], query: string): ScoredArtist[] {
  if (!query.trim()) {
    return artists.map((a) => ({ artist: a, score: 0, matches: [] }));
  }
  const scored = artists.map((a) => ({ artist: a, ...scoreArtist(a, query) }));
  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score);
}
