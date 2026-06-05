import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { saints } from "../data/saints";
import { feastsForLiturgicalYear, currentSeason } from "../lib/liturgical";
import { PageShell } from "../components/layout/PageShell";
import { Input } from "../components/ui/input";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";

// /library — small lookups artists actually use: feast dates, saint
// patronage, what season we're in. Data already lives in this repo;
// this is just the lens.

export default function Library() {
  const [q, setQ] = useState("");
  const norm = q.toLowerCase().trim();
  const season = currentSeason();
  const upcomingFeasts = useMemo(() => feastsForLiturgicalYear(new Date()), []);

  const saintMatches = useMemo(
    () =>
      norm.length === 0
        ? saints.slice(0, 12)
        : saints.filter(
            (s) =>
              s.name.toLowerCase().includes(norm) ||
              (s.also ?? []).some((a) => a.toLowerCase().includes(norm)) ||
              s.patronOf.some((p) => p.toLowerCase().includes(norm)),
          ),
    [norm],
  );

  const feastMatches = useMemo(
    () =>
      norm.length === 0
        ? upcomingFeasts.slice(0, 8)
        : upcomingFeasts.filter((f) => f.name.toLowerCase().includes(norm)),
    [norm, upcomingFeasts],
  );

  return (
    <PageShell>
      <Seo
        title="The Library — feasts, saints, the season"
        description="Quick lookups for guild artists: feast dates, saint patronage, the current liturgical season."
        path="/library"
      />
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          The library
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          A small reference.
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted leading-relaxed">
          The current liturgical season, the next feasts, and the saints
          the guild keeps on file. For when you need a date, a patron, or
          a feast at a glance.
        </p>
        <Ornament className="my-8" />

        <div className="rounded-md border border-ink/10 bg-parchment-50 p-5 mb-8">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-1">
            Right now we are in
          </div>
          <div className="font-display text-2xl text-ink">{season.name}</div>
          <p className="font-serif text-sm text-ink-soft italic mt-2">
            {season.blurb}
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="A saint, a feast, a patronage… (e.g. Joseph, Pentecost, music)"
            className="pl-10"
          />
        </div>

        <section className="mb-12">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
            Upcoming feasts
          </div>
          {feastMatches.length === 0 ? (
            <p className="font-serif text-sm italic text-ink-muted">No matches.</p>
          ) : (
            <ol className="space-y-2">
              {feastMatches.slice(0, 24).map((f) => (
                <li
                  key={`${f.slug}-${f.date.toISOString()}`}
                  className="flex items-baseline justify-between gap-3 py-2 border-b border-ink/5"
                >
                  <span className="font-display text-base text-ink">
                    {f.name}
                  </span>
                  <span className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted tabular-nums">
                    {f.date.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {f.rank === "solemnity" && (
                      <span className="ml-2 text-gold-600">solemnity</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mb-16">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
            Saints
          </div>
          {saintMatches.length === 0 ? (
            <p className="font-serif text-sm italic text-ink-muted">No matches.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {saintMatches.slice(0, 30).map((s) => (
                <li
                  key={s.slug}
                  className="rounded-md border border-ink/10 bg-parchment-50 p-4"
                >
                  <div className="font-display text-base text-ink leading-tight">
                    {s.name}
                  </div>
                  <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                    Feast {s.feastDay} {monthName(s.feastMonth)}
                  </div>
                  {s.patronOf.length > 0 && (
                    <div className="mt-2 font-serif text-sm italic text-ink-soft">
                      Patron of {s.patronOf.slice(0, 3).join(", ")}.
                    </div>
                  )}
                  <Link
                    to={`/browse?saint=${s.slug}`}
                    className="mt-2 inline-block font-sans text-[11px] uppercase tracking-[0.18em] text-burgundy-500 hover:text-burgundy-600"
                  >
                    Artists who know them →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </PageShell>
  );
}

function monthName(m: number): string {
  return ["", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"][m] ?? "";
}
