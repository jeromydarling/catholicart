import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { artistBySlug, isVerified } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Badge } from "../components/ui/badge";
import { useStore } from "../lib/store";
import { deriveTitle, formatPrice, initials } from "../lib/utils";
import { Seo } from "../components/Seo";
import type { Commission } from "../types";

// Annual catalog — a yearbook of every delivered commission. The
// publication-quality archive that compounds value year over year.
export default function Catalog() {
  const { commissions } = useStore();
  const [year, setYear] = useState<number | "all">(new Date().getFullYear());

  const delivered = useMemo(
    () =>
      commissions
        .filter((c) => c.stage === "delivered" || c.stage === "blessed")
        .sort((a, b) => {
          const at = a.completedAt ?? a.createdAt;
          const bt = b.completedAt ?? b.createdAt;
          return new Date(bt).getTime() - new Date(at).getTime();
        }),
    [commissions],
  );

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const c of delivered) {
      const t = c.completedAt ?? c.createdAt;
      set.add(new Date(t).getFullYear());
    }
    return [...set].sort((a, b) => b - a);
  }, [delivered]);

  const filtered = useMemo(
    () =>
      year === "all"
        ? delivered
        : delivered.filter((c) => {
            const t = c.completedAt ?? c.createdAt;
            return new Date(t).getFullYear() === year;
          }),
    [delivered, year],
  );

  return (
    <PageShell>
      <Seo
        title="The Annual Catalog of Commissioned Beauty"
        description="The yearbook of every sacred work the Locavit guild delivered. Bound annually. Sent to every patron, every artist, every diocese who asked for one."
        path="/catalog"
      />
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Annual catalog
        </div>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tight text-ink leading-[0.95]">
          The yearbook of <span className="italic text-burgundy-500">commissioned beauty</span>.
        </h1>
        <p className="mt-6 font-serif text-lg text-ink-muted max-w-2xl leading-relaxed">
          Every work the guild delivered{year !== "all" ? ` in ${year}` : ""}.
          Bound annually. Sent to every patron, every artist, every diocese
          who asked for one. The proof that the culture can still make
          beautiful things.
        </p>
        <Ornament className="my-10" />

        {/* Year filter */}
        {years.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <YearChip
              label="All years"
              active={year === "all"}
              onClick={() => setYear("all")}
            />
            {years.map((y) => (
              <YearChip
                key={y}
                label={String(y)}
                active={year === y}
                onClick={() => setYear(y)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="container mt-12 pb-12">
        {filtered.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink/15 p-10 text-center">
            <p className="font-display text-2xl text-ink">
              {year !== "all" ? `Nothing yet for ${year}.` : "Catalog is still empty."}
            </p>
            <p className="mt-2 font-serif text-ink-muted">
              The first delivered commission of the year opens the catalog.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filtered.map((c, i) => (
              <CatalogPlate key={c.id} commission={c} i={i} />
            ))}
          </div>
        )}
      </section>

      <section className="container my-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "The world will be saved by beauty." — Dostoevsky
        </p>
      </section>
    </PageShell>
  );
}

function CatalogPlate({ commission: c, i }: { commission: Commission; i: number }) {
  const artist = artistBySlug(c.artistSlug);
  const cat = categoryBySlug(c.category);
  if (!artist) return null;

  // Pick the most recent WIP image as the "hero" plate; fall back to the artist palette.
  const heroWip = c.wip[c.wip.length - 1];
  const fromColor = heroWip?.paletteFrom ?? artist.portraitFrom;
  const toColor = heroWip?.paletteTo ?? artist.portraitTo;
  const pattern = heroWip?.pattern ?? "halo";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
      className="group rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden hover:shadow-plate transition-shadow"
    >
      {/* Plate */}
      <div
        className="aspect-[5/6] relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${fromColor}, ${toColor})` }}
      >
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
          }}
          aria-hidden
        />
        <div className="absolute inset-3 border border-parchment-50/15" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center text-parchment-50/80">
          <PlateGlyph pattern={pattern} />
        </div>
        {/* Bottom scrim — ensures the title reads on any palette */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/35 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-5 text-parchment-50">
          <div
            className="font-display italic text-2xl leading-tight tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] line-clamp-3"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            {c.certificate?.title ?? deriveTitle(c.scope, 60)}
          </div>
          <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] opacity-85">
            {cat?.shortName} · {c.completedAt
              ? new Date(c.completedAt).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full grid place-items-center text-parchment-50 font-display text-xs shrink-0"
            style={{
              background: `linear-gradient(135deg, ${artist.portraitFrom}, ${artist.portraitTo})`,
            }}
          >
            {initials(artist.name)}
          </div>
          <div className="grow min-w-0">
            <Link
              to={`/artists/${artist.slug}`}
              className="font-display text-base text-ink hover:text-burgundy-500 truncate block"
            >
              {artist.name}
            </Link>
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted truncate">
              {artist.city}
            </div>
          </div>
          {isVerified(artist) && (
            <ShieldCheck className="h-4 w-4 text-olive-600 shrink-0" />
          )}
        </div>
        <p className="mt-3 font-serif text-sm text-ink-soft line-clamp-2 leading-snug">
          For {c.parishOrChapel ?? c.setting.toLowerCase()}.
        </p>
        <div className="mt-3 flex items-baseline justify-between gap-3 flex-wrap">
          <div className="font-sans text-xs text-ink-muted tabular-nums">
            {c.artistTotalUsd != null && (
              <>{formatPrice(c.artistTotalUsd)} · {Math.round((c.platformFeePct) * 100)}% fee</>
            )}
          </div>
          {c.blessing && <Badge variant="olive">Blessed</Badge>}
          {c.feastDeadline && (
            <Badge variant="lapis">{c.feastDeadline.name}</Badge>
          )}
        </div>
        {c.certificate && (
          <Link
            to={`/certificate/${c.id}`}
            className="mt-3 inline-flex items-center font-sans text-xs uppercase tracking-[0.18em] text-burgundy-500 hover:text-burgundy-600"
          >
            Certificate · {c.certificate.serial}
            <ArrowRight className="h-3 w-3 ml-1.5" />
          </Link>
        )}
      </div>
    </motion.article>
  );
}

function YearChip({
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
          ? "bg-ink text-parchment-50"
          : "bg-parchment-100 text-ink-soft hover:bg-parchment-200/70"
      }`}
    >
      {label}
    </button>
  );
}

function PlateGlyph({
  pattern,
}: {
  pattern: "halo" | "cross" | "vesica" | "triptych" | "frame";
}) {
  const stroke = "currentColor";
  if (pattern === "cross")
    return (
      <svg viewBox="0 0 200 240" className="h-2/3 w-2/3" fill="none" stroke={stroke} strokeWidth="1.4" opacity="0.55">
        <path d="M100 30 v180 M50 90 h100" />
      </svg>
    );
  if (pattern === "vesica")
    return (
      <svg viewBox="0 0 200 240" className="h-2/3 w-2/3" fill="none" stroke={stroke} strokeWidth="1.1" opacity="0.55">
        <path d="M100 40 C40 80 40 160 100 200 C160 160 160 80 100 40 Z" />
      </svg>
    );
  if (pattern === "frame")
    return (
      <svg viewBox="0 0 200 240" className="h-2/3 w-2/3" fill="none" stroke={stroke} strokeWidth="1.1" opacity="0.55">
        <rect x="30" y="30" width="140" height="180" />
        <rect x="44" y="44" width="112" height="152" opacity="0.6" />
      </svg>
    );
  if (pattern === "triptych")
    return (
      <svg viewBox="0 0 200 240" className="h-2/3 w-2/3" fill="none" stroke={stroke} strokeWidth="1.1" opacity="0.55">
        <path d="M40 40 v160 h36 v-160 z M82 30 v180 h36 v-180 z M124 40 v160 h36 v-160 z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 200 240" className="h-2/3 w-2/3" fill="none" stroke={stroke} strokeWidth="1.2" opacity="0.55">
      <circle cx="100" cy="80" r="44" />
      <circle cx="100" cy="80" r="56" opacity="0.5" />
      <path d="M100 124 v110 M70 234 h60" strokeWidth="0.9" />
    </svg>
  );
}
