// Locavit economic engine.
//
// The artist receives 100% of the price they quote, paid across
// three escrow milestones (deposit → midpoint → final). A small 2%
// platform contribution — a tithe to keep the guild open — is
// settled at the very end, after final release. Patrons are never
// charged the contribution along the way; the artist's milestones
// are pure.
//
// This is the brand promise: the platform is free for the good of
// the world. Two cents on the dollar at the close, no more.

import type { EscrowMilestone } from "../types";

export const PLATFORM_FEE_PCT = 0.02; // 2%, settled at final release

export const ESCROW_SPLIT: { stage: EscrowMilestone["stage"]; label: string; pct: number }[] = [
  { stage: "deposit",  label: "Deposit",         pct: 0.25 },
  { stage: "midpoint", label: "Midpoint review", pct: 0.35 },
  { stage: "final",    label: "Final delivery",  pct: 0.40 },
];

export interface PricingBreakdown {
  artistTotalUsd: number;
  platformFeePct: number;
  platformFeeUsd: number;
  totalDueUsd: number;
  escrow: EscrowMilestone[];
}

export function computePricing(
  artistTotalUsd: number,
  platformFeePct = PLATFORM_FEE_PCT,
): PricingBreakdown {
  const platformFeeUsd = Math.round(artistTotalUsd * platformFeePct);
  const totalDueUsd = artistTotalUsd + platformFeeUsd;
  const escrow: EscrowMilestone[] = ESCROW_SPLIT.map(({ stage, label, pct }) => ({
    stage,
    label,
    pct,
    amountUsd: Math.round(artistTotalUsd * pct),
    status: "unfunded",
  }));
  // Reconciliation in case rounding lost a dollar
  const sum = escrow.reduce((s, m) => s + m.amountUsd, 0);
  if (sum !== artistTotalUsd) {
    escrow[escrow.length - 1].amountUsd += artistTotalUsd - sum;
  }
  return { artistTotalUsd, platformFeePct, platformFeeUsd, totalDueUsd, escrow };
}

export function escrowProgressPct(escrow: EscrowMilestone[]): number {
  if (escrow.length === 0) return 0;
  const released = escrow
    .filter((m) => m.status === "released")
    .reduce((s, m) => s + m.pct, 0);
  return Math.round(released * 100);
}

export function escrowHeldUsd(escrow: EscrowMilestone[]): number {
  return escrow
    .filter((m) => m.status === "held")
    .reduce((s, m) => s + m.amountUsd, 0);
}

export function escrowReleasedUsd(escrow: EscrowMilestone[]): number {
  return escrow
    .filter((m) => m.status === "released")
    .reduce((s, m) => s + m.amountUsd, 0);
}
