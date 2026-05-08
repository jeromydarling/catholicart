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
  verification?: Verification;
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

// === Pastor / verifier endorsement ===

export type VerifierRole =
  | "pastor"            // Diocesan parish priest
  | "religious-superior" // Abbot, abbess, provincial of a religious community
  | "chaplain"          // Chaplain or rector (military, hospital, university, etc.)
  | "chancery";         // Diocesan chancery (fallback / escalation only)

export type VerificationStatus =
  | "pending"            // Submitted; awaiting verifier
  | "endorsed"           // Verifier endorsed
  | "endorsed-chancery-pending" // Verifier endorsed; chancery still must confirm (free webmail path)
  | "chancery-confirmed" // Both verifier endorsed AND chancery confirmed
  | "declined"           // Verifier declined
  | "discuss"            // Verifier requested a conversation first
  | "expired"            // Past 1-year window
  | "revoked";           // Endorsement revoked by verifier

export interface Verification {
  token: string;             // Magic-link token (also drives /verify/:token)
  chanceryToken?: string;    // Separate token for the chancery confirmation flow
  status: VerificationStatus;
  role: VerifierRole;
  verifierName: string;      // "Fr. John Smith"
  verifierEmail: string;     // The address we send the magic-link to
  verifierEmailIsFreeWebmail: boolean;
  parishOrCommunity: string; // "St. Mary's Parish, Pittsburgh PA"
  parishWebsite?: string;
  diocese?: string;          // Required if free-webmail (chancery path)
  chanceryEmail?: string;    // Where the chancery escalation goes
  notes?: string;            // Optional notes from the verifier
  chanceryNotes?: string;    // Optional notes from the chancery
  createdAt: string;
  endorsedAt?: string;
  chanceryConfirmedAt?: string;
  expiresAt?: string;        // 1 year after endorsedAt
}

export interface Quote {
  text: string;
  attribution: string;
  citation?: string;
}
