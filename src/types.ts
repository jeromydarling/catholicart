export type CategorySlug =
  | "sacred-painting"
  | "iconography"
  | "sculpture"
  | "stained-glass-mosaic"
  | "sacred-music"
  | "sacred-poetry"
  | "liturgical-drama"
  | "image-making";

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  blurb: string;
  glyph: string;
  paletteFrom: string;
  paletteTo: string;
}

export interface Tier {
  id: string;
  name: string;
  startingAt: number;
  description: string;
  turnaroundWeeks: [number, number];
  includes: string[];
}

export interface Artwork {
  id: string;
  title: string;
  year: number;
  medium: string;
  dimensions?: string;
  caption: string;
  paletteFrom: string;
  paletteTo: string;
  accent?: string;
  pattern?: "halo" | "cross" | "vesica" | "triptych" | "frame";
}

export interface Artist {
  slug: string;
  name: string;
  honorific?: string;
  region: string;
  city: string;
  patron?: string;
  yearsPracticing: number;
  categories: CategorySlug[];
  vocationStatement: string;
  bio: string[];
  formation: string[];
  acceptingCommissions: boolean;
  customPricing: boolean;
  startingAt: number;
  portraitFrom: string;
  portraitTo: string;
  works: Artwork[];
  tiers: Tier[];
}

export interface CommissionRequest {
  id: string;
  artistSlug: string;
  fromName: string;
  fromEmail: string;
  category: CategorySlug;
  setting: string;
  description: string;
  budgetUsd?: number;
  preferredDeadline?: string;
  createdAt: string;
  status: "draft" | "sent" | "accepted" | "declined";
}

export interface Quote {
  text: string;
  attribution: string;
  citation?: string;
}
