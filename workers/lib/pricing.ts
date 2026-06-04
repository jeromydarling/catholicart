// Server-side mirror of src/lib/pricing.ts.

export const PLATFORM_FEE_PCT = 0.10;

export interface PricingBreakdown {
  artistTotalUsd: number;
  platformFeePct: number;
  platformFeeUsd: number;
  totalDueUsd: number;
  escrow: { stage: 'deposit' | 'midpoint' | 'final'; label: string; pct: number; amountUsd: number }[];
}

const SPLIT = [
  { stage: 'deposit' as const, label: 'Deposit', pct: 0.25 },
  { stage: 'midpoint' as const, label: 'Midpoint review', pct: 0.35 },
  { stage: 'final' as const, label: 'Final delivery', pct: 0.4 },
];

export function computePricing(
  artistTotalUsd: number,
  platformFeePct = PLATFORM_FEE_PCT,
): PricingBreakdown {
  const platformFeeUsd = Math.round(artistTotalUsd * platformFeePct);
  const totalDueUsd = artistTotalUsd + platformFeeUsd;
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
