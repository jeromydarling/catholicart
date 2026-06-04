// Ars Sacra economic engine.
//
// Honest pricing: the artist receives 100% of the price they quote.
// The platform fee is added on top, paid by the patron. This is the
// inversion of the typical marketplace model — and the brand promise.
//
// Funds are held in three escrow milestones, released by the patron
// as the work moves from deposit → midpoint → final delivery.

import type { EscrowMilestone } from "../types";

export const PLATFORM_FEE_PCT = 0.10; // 10% on top, paid by the patron

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
