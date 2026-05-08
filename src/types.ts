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

// === Commission lifecycle ===

export type CommissionStage =
  | "scoping"           // Patron submitted scope; awaiting artist quote
  | "awaiting-deposit"  // Artist quoted; patron hasn't funded the deposit
  | "in-progress"       // Deposit held; artist is working
  | "midpoint-review"   // Artist marked midpoint; patron must release midpoint funds
  | "final-review"      // Artist marked complete; patron must release final funds
  | "delivered"         // All funds released; work delivered
  | "blessed"           // Optional installation/blessing recorded
  | "cancelled";

export type EscrowStage = "deposit" | "midpoint" | "final";
export type EscrowStatus = "unfunded" | "held" | "released" | "refunded";

export interface EscrowMilestone {
  stage: EscrowStage;
  label: string;          // "Deposit" / "Midpoint review" / "Final delivery"
  pct: number;            // 0.25 / 0.35 / 0.40
  amountUsd: number;
  status: EscrowStatus;
  fundedAt?: string;
  releasedAt?: string;
}

export type MessageAuthorRole = "patron" | "artist" | "system";

export interface CommissionMessage {
  id: string;
  authorRole: MessageAuthorRole;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface WipUpdate {
  id: string;
  caption: string;
  paletteFrom: string;
  paletteTo: string;
  pattern?: "halo" | "cross" | "vesica" | "triptych" | "frame";
  postedAt: string;
}

export interface BlessingRecord {
  recordedAt: string;
  recordedBy: string;
  note?: string;
  parishOrChapel?: string;
}

export interface Commission {
  id: string;
  artistSlug: string;
  patronName: string;
  patronEmail: string;
  category: CategorySlug;
  setting: string;
  scope: string;            // Patron's plain-language description
  artistQuoteNote?: string; // Artist's reply / clarifications
  artistTotalUsd?: number;  // What the artist quotes (artist receives 100% of this)
  platformFeePct: number;   // e.g. 0.10
  platformFeeUsd?: number;  // computed once artist quotes
  totalDueUsd?: number;     // artistTotalUsd + platformFeeUsd
  preferredDeadline?: string;
  feastDeadline?: { feastSlug: string; date: string; name: string };
  patronSaint?: string;
  diocese?: string;
  parishOrChapel?: string;
  stage: CommissionStage;
  escrow: EscrowMilestone[];
  messages: CommissionMessage[];
  wip: WipUpdate[];
  blessing?: BlessingRecord;
  // Provenance certificate fields (filled at delivery)
  certificate?: {
    issuedAt: string;
    serial: string;
    title: string;          // Final title of the work
  };
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

// === Stripe Connect (mocked) ===

export type ConnectStatus = "not-onboarded" | "onboarding" | "verified";

export interface ConnectAccount {
  artistSlug: string;
  status: ConnectStatus;
  payoutAccountLast4?: string;
  payoutAccountBank?: string;
  taxFormStatus: "missing" | "pending" | "on-file";
  startedAt?: string;
  verifiedAt?: string;
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
