// Server-side mirror of src/lib/pricing.ts.
//
// The platform fee is intentionally small (2%) and conceptually a
// "tithe to keep the lights on" — a tiny contribution the patron
// makes to the guild at the end of the project. It is NOT split
// across the three milestones; the artist receives 100% of their
// quote across deposit / midpoint / final, and the 2% is settled
// once at final release as a separate line.

export const PLATFORM_FEE_PCT = 0.02;

export interface PricingBreakdown {
  artistTotalUsd: number;
  platformFeePct: number;
  platformFeeUsd: number;     // owed at final release, separate from escrow
  totalDueUsd: number;        // artist_total + 2% — what patron pays in full
  escrow: { stage: 'deposit' | 'midpoint' | 'final'; label: string; pct: number; amountUsd: number }[];
}

const SPLIT = [
  { stage: 'deposit' as const,  label: 'Deposit',          pct: 0.25 },
  { stage: 'midpoint' as const, label: 'Midpoint review',  pct: 0.35 },
  { stage: 'final' as const,    label: 'Final delivery',   pct: 0.40 },
];

export function computePricing(
  artistTotalUsd: number,
  platformFeePct = PLATFORM_FEE_PCT,
): PricingBreakdown {
  const platformFeeUsd = Math.round(artistTotalUsd * platformFeePct);
  const totalDueUsd = artistTotalUsd + platformFeeUsd;
  // Escrow milestones share artist_total only. The 2% is added at
  // final release time — see workers/api/commissions.ts release flow.
  const escrow = SPLIT.map((m) => ({
    ...m,
    amountUsd: Math.round(artistTotalUsd * m.pct),
  }));
  const sum = escrow.reduce((s, m) => s + m.amountUsd, 0);
  if (sum !== artistTotalUsd) {
    escrow[escrow.length - 1].amountUsd += artistTotalUsd - sum;
  }
  return { artistTotalUsd, platformFeePct, platformFeeUsd, totalDueUsd, escrow };
}
