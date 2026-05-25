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

// ── Reviews ──────────────────────────────────────────────────────
export interface Review {
  id: string;
  commissionId: string;
  artistSlug: string;
  patronName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  createdAt: string;
  // Patron's reply if the artist responded
  artistReply?: { body: string; createdAt: string };
}

// ── Disputes ─────────────────────────────────────────────────────
export type DisputeStatus =
  | "open"
  | "resolved-mediated"      // both parties agreed via conversation
  | "resolved-refund"        // mediator refunded held funds
  | "resolved-release"       // mediator released held funds
  | "withdrawn";

export interface Dispute {
  id: string;
  commissionId: string;
  openedBy: "patron" | "artist";
  reason: string;
  status: DisputeStatus;
  openedAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

// ── Shipping ─────────────────────────────────────────────────────
export interface ShippingRecord {
  carrier: string;             // "FedEx", "UPS", "USPS", "DHL", "Hand-carry"
  trackingNumber?: string;
  insuredFor?: number;         // declared value
  shippedAt: string;
  estimatedArrival?: string;   // ISO date
  deliveredAt?: string;
  notes?: string;
}

// ── IP / reproduction rights ─────────────────────────────────────
export type IpTerms =
  | "patron-exclusive"     // Patron owns the work; artist cannot reproduce
  | "shared-prints"        // Both parties can reproduce; artist may sell prints
  | "artist-retains"       // Artist retains all reproduction rights; patron owns the original
  | "shared-custom";       // Custom terms recorded in customNote

// ── Institutional (B2B) intake ───────────────────────────────────
//
// Dioceses, religious orders, parishes, schools — they don't fill
// out a single-artist commission form. They post an RFP-style brief
// describing the scope (often multiple works), invite proposals from
// guild artists, route through a multi-stakeholder approval chain,
// and pay on NET-30 terms instead of immediate Stripe capture.

export type IntakeKind =
  | "diocese-bulk"        // 14 stations of the cross for 14 parishes
  | "parish-altar"         // one altar, several works
  | "religious-order"      // a community-wide commission
  | "school"               // school chapel, classroom, etc.
  | "other-institution";

export type IntakeStatus =
  | "draft"
  | "open"                 // accepting proposals
  | "shortlisting"         // proposals received; under review
  | "awarded"              // artist(s) selected; commission(s) created
  | "closed";              // no award / cancelled

export interface ApprovalStep {
  role: string;            // "Chancellor", "Pastor", "Finance Council", etc.
  name?: string;
  email?: string;
  status: "pending" | "approved" | "declined";
  decidedAt?: string;
  note?: string;
}

export interface InstitutionalIntake {
  id: string;
  kind: IntakeKind;
  // Institution
  institutionName: string;
  diocese?: string;
  contactName: string;
  contactEmail: string;
  contactRole?: string;    // "Director of Sacred Worship", "Chancellor", etc.
  // The brief
  title: string;
  brief: string;
  craft: CategorySlug | "mixed";
  budgetTotalUsd?: number;
  budgetPerWorkUsd?: number;
  quantity: number;        // how many works (e.g. 14 stations)
  preferredDelivery?: string; // ISO date
  feastDeadline?: { feastSlug: string; date: string; name: string };
  // Billing
  invoicingTerms: "stripe-immediate" | "net-30" | "net-60" | "purchase-order";
  poNumber?: string;
  // Workflow
  status: IntakeStatus;
  approvalChain: ApprovalStep[];
  proposalIds: string[];   // references Proposal[].id
  awardedProposalId?: string;
  commissionIds: string[]; // commissions spawned from this intake (one or many)
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  intakeId: string;
  artistSlug: string;
  artistName: string;      // denormalized so we can render even if artist is removed
  pricePerWorkUsd: number;
  totalPriceUsd: number;
  estimatedWeeks: number;
  pitchBody: string;
  paletteFrom?: string;
  paletteTo?: string;
  status: "submitted" | "shortlisted" | "awarded" | "declined" | "withdrawn";
  submittedAt: string;
  decidedAt?: string;
}

// ── Artist availability ─────────────────────────────────────────
// Per-artist monthly toggle: "accepting" / "full" / "away".
// Keyed by "YYYY-MM" so it survives JSON serialization cleanly.
export type AvailabilityMonthStatus = "accepting" | "full" | "away";

export interface ArtistAvailability {
  artistSlug: string;
  // Per-month overrides; missing keys default to "accepting".
  months: Record<string, AvailabilityMonthStatus>; // key = "2026-05"
  // Maximum number of concurrent in-progress commissions before the
  // artist is auto-marked unavailable.
  concurrentCap?: number;
  updatedAt: string;
}

// ── Apprenticeship applications ─────────────────────────────────
export interface ApprenticeshipApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantAge?: number;
  craft: CategorySlug;
  desiredMasterSlug?: string;       // artist they'd like to apprentice with
  parishOrCommunity?: string;
  pastorEmail?: string;
  portfolioUrl?: string;
  letter: string;                    // their pitch in their own words
  status: "submitted" | "shortlisted" | "interviewed" | "offered" | "declined" | "matched";
  createdAt: string;
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
  shipping?: ShippingRecord;
  ipTerms?: IpTerms;
  ipCustomNote?: string;
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
