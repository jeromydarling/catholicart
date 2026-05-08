import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  currentSeason,
  daysUntil,
  feastsForLiturgicalYear,
} from "../lib/liturgical";
import { saintsThisMonth } from "../data/artist-tags";
import { saintBySlug } from "../data/saints";
import { Ornament } from "./Ornament";

// Hero band that orients patrons in the liturgical year. Renders the
// current season, the next major feast with countdown, and the saints
// whose feasts land in the current month.
export function LiturgicalSeasonBanner() {
  const today = new Date();
  const season = currentSeason(today);
  const upcoming = feastsForLiturgicalYear(today).slice(0, 6);
  const next = upcoming[0];
  const monthSaints = saintsThisMonth(today).slice(0, 4);

  return (
    <section className="relative overflow-hidden border-y border-ink/10">
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          background: `linear-gradient(135deg, ${season.paletteFrom} 0%, ${season.paletteTo} 100%)`,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
        }}
        aria-hidden
      />
      <div className="relative container py-12 sm:py-16 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600">
            Now in the Church
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-3 font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]"
          >
            <span className="italic">{season.name}</span>{" "}
            <SeasonDot color={season.color} />
          </motion.h2>
          <p className="mt-4 font-serif text-lg text-ink-soft max-w-xl leading-relaxed">
            {season.blurb} Commission with the calendar — work delivered for
            the feast it was made to serve.
          </p>

          {next && (
            <div className="mt-7 flex items-center gap-4 flex-wrap">
              <div className="rounded-md border border-ink/10 bg-parchment-50 px-4 py-3 shadow-card">
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                  Next major feast
                </div>
                <div className="mt-0.5 font-display text-xl text-ink">
                  {next.name}
                </div>
                <div className="mt-0.5 font-sans text-xs text-ink-muted tabular-nums">
                  {next.date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · in {daysUntil(next.date, today)} days
                </div>
              </div>
              <Link
                to="/browse"
                className="font-sans text-xs uppercase tracking-[0.22em] text-burgundy-500 inline-flex items-center hover:text-burgundy-600"
              >
                Commission for {next.name.split(" ")[0]}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-1.5">
            {upcoming.slice(0, 6).map((f) => (
              <span
                key={f.slug + f.date.toISOString()}
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-parchment-50/80 px-3 py-1 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft"
              >
                {f.name}
                <span className="text-ink-muted tabular-nums">
                  {f.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 lg:border-l lg:border-ink/10 lg:pl-8">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600">
            Their feasts this month
          </div>
          <Ornament className="my-3" />
          {monthSaints.length === 0 ? (
            <p className="font-serif italic text-ink-muted">
              No major saints' feasts this month — but every day belongs to someone.
            </p>
          ) : (
            <ul className="space-y-3">
              {monthSaints.map((s) => (
                <li key={s.slug}>
                  <Link
                    to={`/browse?saint=${s.slug}`}
                    className="flex items-center gap-3 rounded-md p-2 -mx-2 hover:bg-parchment-50 focusable transition-colors"
                  >
                    <div
                      className="h-10 w-10 rounded-full grid place-items-center text-parchment-50 font-display text-xs shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${s.paletteFrom}, ${s.paletteTo})`,
                      }}
                    >
                      {s.name.split(" ")[1]?.[0] ?? s.name[0]}
                    </div>
                    <div className="grow min-w-0">
                      <div className="font-display text-base text-ink truncate">
                        {s.name}
                      </div>
                      <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted tabular-nums">
                        {monthLabel(s.feastMonth, s.feastDay)} · patron of {s.patronOf[0]}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-muted shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {/* Hint for upcoming feasts beyond month */}
          <div className="mt-5 pt-5 border-t border-ink/10">
            <Link
              to="/browse"
              className="font-sans text-xs uppercase tracking-[0.22em] text-ink-muted hover:text-ink inline-flex items-center"
            >
              Browse the full guild <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeasonDot({ color }: { color: "violet" | "white" | "green" | "red" | "rose" }) {
  const map: Record<string, string> = {
    violet: "bg-burgundy-500",
    white: "bg-gold-500",
    green: "bg-olive-500",
    red: "bg-burgundy-600",
    rose: "bg-burgundy-400",
  };
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ml-1 align-middle ${map[color]}`}
      aria-hidden
    />
  );
}

function monthLabel(m: number, d: number) {
  const dt = new Date(2025, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

// Saint reference (used to keep TS unsatisfied import quiet)
saintBySlug;
