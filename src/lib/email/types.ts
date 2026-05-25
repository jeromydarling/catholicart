// Every transactional email the platform sends, as a discriminated union.
// In dev these get pushed to a local outbox; in production they fan out
// through Resend.

import type {
  Commission,
  Verification,
  Artist,
} from "../../types";

export type EmailCategory =
  | "transactional"   // payment receipts, endorsement requests — cannot unsubscribe
  | "milestone"        // WIP updates, midpoint marked, etc.
  | "digest"           // weekly summary
  | "marketing";       // new journal issue, prize announcements

export type EmailEvent =
  // Commission lifecycle
  | { kind: "commission.created";    commission: Commission; artist?: Artist }
  | { kind: "commission.quoted";     commission: Commission; artist?: Artist }
  | { kind: "commission.funded";     commission: Commission; artist?: Artist; stage: "deposit" | "midpoint" | "final" }
  | { kind: "commission.released";   commission: Commission; artist?: Artist; stage: "deposit" | "midpoint" | "final" }
  | { kind: "commission.midpoint";   commission: Commission; artist?: Artist }
  | { kind: "commission.final";      commission: Commission; artist?: Artist }
  | { kind: "commission.delivered";  commission: Commission; artist?: Artist }
  | { kind: "commission.blessed";    commission: Commission; artist?: Artist }
  | { kind: "commission.cancelled";  commission: Commission; artist?: Artist }
  | { kind: "commission.wip";        commission: Commission; artist?: Artist; caption: string }
  | { kind: "commission.message";    commission: Commission; artist?: Artist; fromRole: "patron" | "artist"; body: string }
  // Pastor endorsement
  | { kind: "verification.requested";    verification: Verification }
  | { kind: "verification.endorsed";     verification: Verification }
  | { kind: "verification.declined";     verification: Verification }
  | { kind: "verification.chancery";     verification: Verification }
  | { kind: "verification.confirmed";    verification: Verification }
  // Misc
  | { kind: "subscribe.journal";     email: string };

export type RecipientRole = "patron" | "artist" | "priest" | "chancery" | "admin" | "subscriber";

export interface Recipient {
  email: string;
  name?: string;
  role: RecipientRole;
}

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

// What we store in the outbox.
export interface OutboxEntry {
  id: string;
  createdAt: string;
  event: EmailEvent;
  recipients: Recipient[];
  rendered: RenderedEmail;
  category: EmailCategory;
  status: "queued" | "sent" | "skipped-unsubscribed" | "failed";
  failureReason?: string;
}

// Per-email-address unsubscribe preferences.
export interface EmailPreferences {
  email: string;
  unsubscribeAll: boolean;
  milestone: boolean;   // false = unsubscribed from milestone updates
  digest: boolean;
  marketing: boolean;
  updatedAt: string;
}

export function defaultPreferences(email: string): EmailPreferences {
  return {
    email,
    unsubscribeAll: false,
    milestone: true,
    digest: true,
    marketing: true,
    updatedAt: new Date().toISOString(),
  };
}
