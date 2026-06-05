import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  Filter,
  Mail,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import {
  DIRECTORY_ENTRIES,
  DIRECTORY_COUNTRIES,
  DIRECTORY_DISCIPLINES,
  type DirectoryEntry,
} from "../data/discovery-directory";
import { useT } from "../i18n";

// /directory — the researched discovery list. Real Catholic sacred
// artists and religious-order workshops, sourced from public sources,
// shown with a clear "not yet a member" framing.

export default function Directory() {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [discipline, setDiscipline] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const norm = q.toLowerCase().trim();
    return DIRECTORY_ENTRIES.filter((e) => {
      if (country && e.country !== country) return false;
      if (discipline && !e.disciplines.includes(discipline)) return false;
      if (!norm) return true;
      return (
        e.name.toLowerCase().includes(norm) ||
        e.city?.toLowerCase().includes(norm) ||
        e.disciplines.some((d) => d.toLowerCase().includes(norm)) ||
        e.order?.toLowerCase().includes(norm) ||
        e.endorser?.toLowerCase().includes(norm)
      );
    });
  }, [q, country, discipline]);

  return (
    <PageShell>
      <Seo
        title="The Directory — Catholic sacred artists worldwide · Locavit"
        description="A researched directory of living Catholic sacred artists and religious-order workshops. Iconography, sculpture, vestments, illumination, mosaic — sourced from public commissions and parish renovations."
        path="/directory"
      />

      <section className="container pt-12 sm:pt-16 max-w-4xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          {t("directory.page.kicker")}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight text-ink leading-[1.05]">
          {t("directory.page.title.line1")}
          <span className="block italic text-burgundy-500 mt-1">
            {t("directory.page.title.line2")}
          </span>
        </h1>
        <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed max-w-3xl">
          {DIRECTORY_ENTRIES.length} living artists and religious-order
          workshops across {DIRECTORY_COUNTRIES.length} countries —
          iconographers, sculptors, vestment makers, illuminators,
          stone carvers, calligraphers. Researched from public
          commissions, parish renovations, and order websites.
        </p>
        <div className="mt-6 rounded-md border border-gold-500/30 bg-gold-500/5 p-4 max-w-3xl">
          <p className="font-serif text-sm text-ink leading-relaxed">
            <strong className="font-medium">{t("directory.page.disclaimer")}</strong>{" "}
            If you're one of the artists below, write to{" "}
            <a
              href="mailto:hello@locavit.com"
              className="text-burgundy-500 hover:text-burgundy-600 underline underline-offset-2"
            >
              hello@locavit.com
            </a>{" "}
            and we'll set up your guild profile.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/map">
              <MapPin className="mr-2 h-4 w-4" />
              See them on the map
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/features">
              Every feature of the guild
            </Link>
          </Button>
        </div>
        <Ornament className="my-10" />
      </section>

      {/* Search + filters */}
      <section className="container max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 mb-6">
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="A name, a city, a craft, an order…"
              className="pl-10"
            />
          </div>
          <div className="lg:col-span-3">
            <select
              value={country ?? ""}
              onChange={(e) => setCountry(e.target.value || null)}
              className="w-full h-10 rounded-md border border-ink/15 bg-parchment-50 px-3 font-sans text-sm text-ink focusable"
            >
              <option value="">All countries ({DIRECTORY_COUNTRIES.length})</option>
              {DIRECTORY_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3">
            <select
              value={discipline ?? ""}
              onChange={(e) => setDiscipline(e.target.value || null)}
              className="w-full h-10 rounded-md border border-ink/15 bg-parchment-50 px-3 font-sans text-sm text-ink focusable"
            >
              <option value="">All disciplines ({DIRECTORY_DISCIPLINES.length})</option>
              {DIRECTORY_DISCIPLINES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {(country || discipline || q) && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-ink-muted" />
            <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </span>
            <button
              onClick={() => { setQ(""); setCountry(null); setDiscipline(null); }}
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-parchment-50 px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:bg-parchment-100"
            >
              <X className="h-2.5 w-2.5" /> Clear
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink/15 p-10 text-center">
            <div className="font-display text-xl text-ink">No matches.</div>
            <p className="mt-2 font-serif text-ink-muted">
              Try widening the search.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
            {filtered.map((e, i) => (
              <DirectoryCard key={e.id} entry={e} index={i} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function DirectoryCard({ entry, index }: { entry: DirectoryEntry; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.4) }}
      className="rounded-md border border-ink/10 bg-parchment-50 p-5 hover:border-burgundy-500/40 hover:shadow-card transition-all flex flex-col"
    >
      <div className="flex items-start gap-2 mb-2">
        <h3 className="font-display text-lg text-ink leading-tight grow">
          {entry.name}
        </h3>
        {entry.order && (
          <span className="shrink-0 rounded-sm bg-burgundy-500/10 px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-[0.18em] text-burgundy-500">
            {entry.order}
          </span>
        )}
      </div>
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {[entry.city, entry.region, entry.country].filter(Boolean).join(" · ")}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {entry.disciplines.slice(0, 3).map((d) => (
          <span
            key={d}
            className="rounded-sm bg-parchment-100 px-2 py-0.5 font-sans text-[10px] text-ink-soft"
          >
            {d}
          </span>
        ))}
        {entry.disciplines.length > 3 && (
          <span className="font-sans text-[10px] text-ink-muted self-center">
            +{entry.disciplines.length - 3}
          </span>
        )}
      </div>
      {entry.notableWorks.length > 0 && (
        <p className="mt-3 font-serif text-sm text-ink-soft leading-snug italic grow">
          {entry.notableWorks[0]}
        </p>
      )}
      {entry.endorser && (
        <div className="mt-3 font-sans text-[10px] uppercase tracking-[0.18em] text-olive-600">
          {entry.endorser.split(";")[0].trim()}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-ink/5 flex items-center gap-3 flex-wrap">
        {entry.website && (
          <a
            href={entry.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-sans text-[11px] uppercase tracking-[0.18em] text-burgundy-500 hover:text-burgundy-600"
          >
            Website <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
        {entry.email && (
          <a
            href={`mailto:${entry.email}`}
            className="inline-flex items-center gap-1 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
          >
            <Mail className="h-2.5 w-2.5" /> Email
          </a>
        )}
        {entry.social && (
          <a
            href={
              entry.social.startsWith("@")
                ? `https://instagram.com/${entry.social.slice(1)}`
                : entry.social
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-sans text-[11px] text-ink-soft hover:text-ink"
          >
            {entry.social}
          </a>
        )}
        {entry.sourceUrl && (
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 ml-auto font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink-soft"
            title="Source"
          >
            <BookOpen className="h-2.5 w-2.5" /> Source
          </a>
        )}
      </div>
      {entry.notes && /maronite|chaldean|ukrainian greek|melkite|coptic|syro-malabar|orthodox|anglican/i.test(entry.notes) && (
        <div className="mt-3 font-sans text-[10px] italic text-ink-muted">
          {extractRite(entry.notes)}
        </div>
      )}
    </motion.article>
  );
}

function extractRite(notes: string): string {
  const m = notes.match(/(maronite|chaldean|ukrainian greek catholic|melkite|coptic catholic|syro-malabar|orthodox|anglican)/i);
  if (!m) return "";
  const term = m[1];
  if (/orthodox|anglican/i.test(term)) {
    return `Note: ${term} — takes Catholic commissions`;
  }
  return `Rite: ${term}`;
}
