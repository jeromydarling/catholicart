import { motion } from "motion/react";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import type { EscrowMilestone } from "../types";
import { formatPrice } from "../lib/utils";
import { cn } from "../lib/utils";

interface EscrowMeterProps {
  escrow: EscrowMilestone[];
  // If provided, indicates the patron is the viewer (lets us label affordances)
  perspective?: "patron" | "artist";
  className?: string;
}

export function EscrowMeter({ escrow, className }: EscrowMeterProps) {
  if (escrow.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-ink/15 bg-parchment-50 p-6 text-center",
          className,
        )}
      >
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          Escrow
        </div>
        <p className="mt-2 font-serif text-sm text-ink-muted">
          The artist has not yet sent a quote. Funding milestones appear once
          the price is agreed.
        </p>
      </div>
    );
  }

  const totalArtist = escrow.reduce((s, m) => s + m.amountUsd, 0);
  const released = escrow
    .filter((m) => m.status === "released")
    .reduce((s, m) => s + m.amountUsd, 0);
  const releasedPct = totalArtist > 0 ? (released / totalArtist) * 100 : 0;

  return (
    <div className={cn("rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
            Escrow
          </div>
          <div className="mt-1 font-display text-2xl text-ink leading-none tabular-nums">
            {formatPrice(released)}
            <span className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted ml-2">
              of {formatPrice(totalArtist)} released
            </span>
          </div>
        </div>
        <div className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted tabular-nums">
          {Math.round(releasedPct)}%
        </div>
      </div>

      {/* Bar */}
      <div className="mt-4 h-1.5 rounded-full bg-parchment-200 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${releasedPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-olive-500 to-olive-600"
        />
      </div>

      {/* Milestones */}
      <ol className="mt-6 space-y-4">
        {escrow.map((m) => {
          const isReleased = m.status === "released";
          const isHeld = m.status === "held";
          const isRefunded = m.status === "refunded";
          const Icon = isReleased ? CheckCircle2 : isHeld ? Lock : Clock;
          const tone = isReleased
            ? "bg-olive-500/15 text-olive-600 ring-olive-500/30"
            : isHeld
              ? "bg-gold-500/15 text-gold-600 ring-gold-500/30"
              : isRefunded
                ? "bg-burgundy-500/10 text-burgundy-600 ring-burgundy-500/20"
                : "bg-parchment-200 text-ink-soft ring-ink/10";
          return (
            <li key={m.stage} className="flex items-start gap-4">
              <div
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full ring-1 shrink-0",
                  tone,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="grow">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="font-display text-base text-ink">
                    {m.label}
                    <span className="ml-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                      {Math.round(m.pct * 100)}%
                    </span>
                  </div>
                  <div className="font-sans text-sm text-ink tabular-nums">
                    {formatPrice(m.amountUsd)}
                  </div>
                </div>
                <div className="mt-0.5 font-sans text-xs text-ink-muted">
                  {isReleased && m.releasedAt
                    ? `Released ${formatDate(m.releasedAt)}`
                    : isHeld && m.fundedAt
                      ? `Held in escrow since ${formatDate(m.fundedAt)}`
                      : isRefunded
                        ? "Refunded"
                        : "Awaiting funding"}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
