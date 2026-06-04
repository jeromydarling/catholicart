import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
// ShieldCheck is still used by the row (verified artist).
import { artists, isVerified } from "../data/artists";
import { artistBySlug } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { categories } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useStore } from "../lib/store";
import { deriveTitle, formatPrice, initials } from "../lib/utils";
import {
  escrowReleasedUsd,
  escrowHeldUsd,
} from "../lib/pricing";
import { Seo } from "../components/Seo";
import type { Commission, CommissionStage, CategorySlug } from "../types";

const STAGE_COPY: Record<
  CommissionStage,
  { label: string; tone: "gold" | "olive" | "burgundy" | "lapis" | "outline" }
> = {
  scoping:           { label: "Scoping",         tone: "gold" },
  "awaiting-deposit":{ label: "Awaiting deposit",tone: "gold" },
  "in-progress":     { label: "In studio",       tone: "lapis" },
  "midpoint-review": { label: "Midpoint review", tone: "gold" },
  "final-review":    { label: "Final review",    tone: "gold" },
  delivered:         { label: "Delivered",       tone: "olive" },
  blessed:           { label: "Blessed",         tone: "olive" },
  cancelled:         { label: "Cancelled",       tone: "burgundy" },
};

// The Ledger — a quiet record of every work made through the guild.
// Not a dashboard. Closer to a parish bulletin: who, what, when,
// where it will live. The numbers are present but not the point.
export default function Ledger() {
  const { commissions } = useStore();
  const [filter, setFilter] = useState<"all" | "delivered" | "in-flight" | CategorySlug>(
    "all",
  );

  const stats = useMemo(() => {
    const completed = commissions.filter(
      (c) =>
        (c.stage === "delivered" || c.stage === "blessed") &&
        c.artistTotalUsd != null,
    );
    const inFlight = commissions.filter(
      (c) =>
        c.stage !== "delivered" &&
        c.stage !== "blessed" &&
        c.stage !== "cancelled",
    );
    const totalToArtists = completed.reduce(
      (s, c) => s + (c.artistTotalUsd ?? 0),
      0,
    );
    const totalPlatform = completed.reduce(
      (s, c) => s + (c.platformFeeUsd ?? 0),
      0,
    );
    const totalCommissioned = totalToArtists + totalPlatform;
    const heldRightNow = commissions.reduce(
      (s, c) => s + escrowHeldUsd(c.escrow),
      0,
    );
    return {
      completedCount: completed.length,
      inFlightCount: inFlight.length,
      totalCommissioned,
      totalToArtists,
      totalPlatform,
      heldRightNow,
    };
  }, [commissions]);

  const visible = useMemo(() => {
    if (filter === "all") return commissions;
    if (filter === "delivered")
      return commissions.filter(
        (c) => c.stage === "delivered" || c.stage === "blessed",
      );
    if (filter === "in-flight")
      return commissions.filter(
        (c) =>
          c.stage !== "delivered" &&
          c.stage !== "blessed" &&
          c.stage !== "cancelled",
      );
    return commissions.filter((c) => c.category === filter);
  }, [commissions, filter]);

  return (
    <PageShell>
      <Seo
        title="The Ledger — works made through the guild"
        description="A quiet, public record of every commission made through Ars Sacra. The work, the artist, the patron, where it will live. Updated in real time."
        path="/ledger"
      />
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          A public record
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          Works made through the guild.
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl leading-relaxed">
          A quiet ledger of every commission — who made it, who it was
          for, where it will live. The numbers are present so nothing is
          hidden, but the work is the point.
        </p>
        <Ornament className="my-10" />
      </section>

      {/* Quiet totals — small, single line, no big numbers competing
          with the works themselves. */}
      <section className="container">
        <p className="font-serif text-sm sm:text-base text-ink-muted leading-relaxed max-w-3xl">
          <span className="text-ink font-medium tabular-nums">
            {stats.completedCount}
          </span>{" "}
          {stats.completedCount === 1 ? "work" : "works"} completed
          {stats.inFlightCount > 0 && (
            <>
              ;{" "}
              <span className="text-ink font-medium tabular-nums">
                {stats.inFlightCount}
              </span>{" "}
              in the studio
            </>
          )}
          .{" "}
          {stats.totalToArtists > 0 && (
            <>
              <span className="tabular-nums">{formatPrice(stats.totalToArtists)}</span>{" "}
              has gone to the artists; the guild has kept{" "}
              <span className="tabular-nums">{formatPrice(stats.totalPlatform)}</span>{" "}
              from those works.
            </>
          )}
          {stats.heldRightNow > 0 && (
            <>
              {" "}
              <span className="tabular-nums">{formatPrice(stats.heldRightNow)}</span>{" "}
              is currently held in escrow for active commissions.
            </>
          )}
        </p>
      </section>

      {/* Filter */}
      <section className="container mt-12">
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterChip
            label="Delivered"
            active={filter === "delivered"}
            onClick={() => setFilter("delivered")}
          />
          <FilterChip
            label="In flight"
            active={filter === "in-flight"}
            onClick={() => setFilter("in-flight")}
          />
          <span className="mx-1 h-4 w-px bg-ink/15" aria-hidden />
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              label={c.shortName}
              active={filter === c.slug}
              onClick={() => setFilter(c.slug)}
            />
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink/15 p-10 text-center">
            <p className="font-serif text-ink-muted">No commissions match that filter.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((c, i) => (
              <LedgerRow key={c.id} commission={c} i={i} />
            ))}
          </ul>
        )}
      </section>

      <section className="container my-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "Where your treasure is, there will your heart be also." — Mt 6:21
        </p>
      </section>
    </PageShell>
  );
}

function LedgerRow({ commission: c, i }: { commission: Commission; i: number }) {
  const artist = artistBySlug(c.artistSlug);
  const cat = categoryBySlug(c.category);
  const stage = STAGE_COPY[c.stage];
  const released = escrowReleasedUsd(c.escrow);
  const isDelivered = c.stage === "delivered" || c.stage === "blessed";
  if (!artist) return null;
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
      className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-4 sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div
          className="h-12 w-12 rounded-full grid place-items-center text-parchment-50 font-display text-base shrink-0"
          style={{
            background: `linear-gradient(135deg, ${artist.portraitFrom}, ${artist.portraitTo})`,
          }}
        >
          {initials(artist.name)}
        </div>
        <div className="grow min-w-0">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div className="font-display text-lg text-ink leading-tight line-clamp-1">
              {deriveTitle(c.scope, 90)}
            </div>
            <Badge variant={stage.tone}>{stage.label}</Badge>
          </div>
          <div className="mt-1 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted flex items-center gap-2 flex-wrap">
            <Link
              to={`/artists/${artist.slug}`}
              className="hover:text-burgundy-500"
            >
              {artist.name}
            </Link>
            {isVerified(artist) && (
              <ShieldCheck className="h-3 w-3 text-olive-600" />
            )}
            <span className="opacity-50">·</span>
            <span>{cat?.shortName}</span>
            <span className="opacity-50">·</span>
            <span>
              {anonymizePatron(c.patronName)} ·{" "}
              <span className="tabular-nums">
                {new Date(c.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
          </div>

          {c.artistTotalUsd != null && (
            <div className="mt-3 flex items-baseline justify-between gap-3 flex-wrap">
              <div className="font-sans text-xs text-ink-muted tabular-nums">
                <span className="text-olive-600">
                  {formatPrice(c.artistTotalUsd)} to the artist
                </span>
                {released > 0 && released < (c.artistTotalUsd ?? 0) && (
                  <>
                    {" "}· <span>{formatPrice(released)} released so far</span>
                  </>
                )}
              </div>
              {isDelivered && c.certificate && (
                <Link
                  to={`/certificate/${c.id}`}
                  className="font-sans text-xs uppercase tracking-[0.18em] text-burgundy-500 hover:text-burgundy-600 inline-flex items-center"
                >
                  Certificate <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              )}
            </div>
          )}

          {c.feastDeadline && (
            <div className="mt-2 font-serif text-xs italic text-ink-muted">
              For {c.feastDeadline.name}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 font-sans text-xs tracking-wide transition-colors focusable ${
        active
          ? "bg-burgundy-500 text-parchment-50"
          : "bg-parchment-100 text-ink-soft hover:bg-parchment-200/70"
      }`}
    >
      {label}
    </button>
  );
}

function anonymizePatron(name: string) {
  // Initials only for individuals; institutional names pass through.
  if (name.length > 30 || /[A-Z]{2,}/.test(name) || /\b(parish|church|chapel|community|college|university|abbey|monastery)\b/i.test(name))
    return name;
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${last[0]}.`;
}

artists; // keep import live
Button; // (used downstream by the Certificate link styling)
