import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Filter, MapPin, X } from "lucide-react";
import { artists, isVerified } from "../data/artists";
import { categories } from "../data/categories";
import { saints, saintBySlug } from "../data/saints";
import { tagsFor } from "../data/artist-tags";
import type { CategorySlug } from "../types";
import { PageShell } from "../components/layout/PageShell";
import { ArtistCard } from "../components/ArtistCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Ornament } from "../components/Ornament";
import { cn } from "../lib/utils";

const PRICE_BANDS = [
  { id: "any", label: "Any price", min: 0, max: Number.POSITIVE_INFINITY },
  { id: "small", label: "Under $1,500", min: 0, max: 1500 },
  { id: "mid", label: "$1,500 – $7,500", min: 1500, max: 7500 },
  { id: "major", label: "Above $7,500", min: 7500, max: Number.POSITIVE_INFINITY },
] as const;

type PriceId = typeof PRICE_BANDS[number]["id"];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCategory = (params.get("category") || "all") as
    | "all"
    | CategorySlug;
  const acceptingOnly = params.get("accepting") === "true";
  const verifiedOnly = params.get("verified") === "true";
  const priceBand = (params.get("price") || "any") as PriceId;
  const activeSaint = params.get("saint") || "";
  const activeSaintInfo = activeSaint ? saintBySlug(activeSaint) : undefined;

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "all" || value === "any" || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const band = PRICE_BANDS.find((b) => b.id === priceBand)!;
    return artists.filter((a) => {
      if (activeCategory !== "all" && !a.categories.includes(activeCategory))
        return false;
      if (acceptingOnly && !a.acceptingCommissions) return false;
      if (verifiedOnly && !isVerified(a)) return false;
      if (a.startingAt < band.min || a.startingAt > band.max) return false;
      if (activeSaint && !tagsFor(a.slug).saintSlugs.includes(activeSaint))
        return false;
      return true;
    });
  }, [activeCategory, acceptingOnly, verifiedOnly, priceBand, activeSaint]);

  const activeFilterCount =
    (activeCategory !== "all" ? 1 : 0) +
    (acceptingOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (priceBand !== "any" ? 1 : 0) +
    (activeSaint ? 1 : 0);

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          The guild
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
            Browse the artists
          </h1>
          <p className="font-serif text-base text-ink-muted max-w-md">
            {filtered.length} {filtered.length === 1 ? "artist" : "artists"}{" "}
            {activeCategory !== "all" && (
              <>
                in{" "}
                <span className="italic text-burgundy-500">
                  {categories.find((c) => c.slug === activeCategory)?.name}
                </span>
              </>
            )}
            {activeSaintInfo && (
              <>
                {" "}who depict{" "}
                <span className="italic text-burgundy-500">
                  {activeSaintInfo.name}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-parchment-50 px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:bg-parchment-100 focusable"
          >
            <MapPin className="h-3 w-3" /> Map of the Body of Christ
          </Link>
        </div>
        <Ornament className="mt-8" />
      </section>

      <section className="container mt-10 sm:mt-12 grid lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Mobile filter trigger */}
        <div className="lg:hidden flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrawerOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setParams({}, { replace: true })}
              className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 self-start">
          <FilterPanel
            activeCategory={activeCategory}
            acceptingOnly={acceptingOnly}
            verifiedOnly={verifiedOnly}
            priceBand={priceBand}
            activeSaint={activeSaint}
            setParam={setParam}
            onClear={() => setParams({}, { replace: true })}
            activeFilterCount={activeFilterCount}
          />
        </aside>

        <div className="lg:col-span-9">
          {filtered.length === 0 ? (
            <div className="border border-dashed border-ink/15 rounded-md p-10 text-center">
              <div className="font-display text-2xl text-ink">
                No artists match these filters.
              </div>
              <p className="mt-2 font-serif text-ink-muted">
                Try widening the price range or selecting a different craft.
              </p>
              <Button
                onClick={() => setParams({}, { replace: true })}
                variant="outline"
                size="sm"
                className="mt-5"
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {filtered.map((a, i) => (
                <ArtistCard key={a.slug} artist={a} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-parchment-50 shadow-plate overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-ink/10">
              <span className="font-display text-2xl">Filter</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="h-11 w-11 grid place-items-center rounded-sm hover:bg-parchment-100 focusable"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <FilterPanel
                activeCategory={activeCategory}
                acceptingOnly={acceptingOnly}
                verifiedOnly={verifiedOnly}
                priceBand={priceBand}
                activeSaint={activeSaint}
                setParam={setParam}
                onClear={() => setParams({}, { replace: true })}
                activeFilterCount={activeFilterCount}
              />
              <Button
                size="lg"
                className="w-full mt-8"
                onClick={() => setDrawerOpen(false)}
              >
                See {filtered.length} artists
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

interface FilterPanelProps {
  activeCategory: "all" | CategorySlug;
  acceptingOnly: boolean;
  verifiedOnly: boolean;
  priceBand: PriceId;
  activeSaint: string;
  setParam: (key: string, value: string | null) => void;
  onClear: () => void;
  activeFilterCount: number;
}

function FilterPanel({
  activeCategory,
  acceptingOnly,
  verifiedOnly,
  priceBand,
  activeSaint,
  setParam,
  onClear,
  activeFilterCount,
}: FilterPanelProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-600">
          Filter
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-burgundy-500"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterSection title="Craft">
        <FilterChip
          label="All"
          active={activeCategory === "all"}
          onClick={() => setParam("category", "all")}
        />
        {categories.map((c) => (
          <FilterChip
            key={c.slug}
            label={c.shortName}
            active={activeCategory === c.slug}
            onClick={() => setParam("category", c.slug)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Starting price">
        {PRICE_BANDS.map((b) => (
          <FilterChip
            key={b.id}
            label={b.label}
            active={priceBand === b.id}
            onClick={() => setParam("price", b.id)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Trust & availability">
        <CheckboxRow
          checked={verifiedOnly}
          onChange={(v) => setParam("verified", v ? "true" : null)}
          label="Pastor-endorsed only"
        />
        <CheckboxRow
          checked={acceptingOnly}
          onChange={(v) => setParam("accepting", v ? "true" : null)}
          label="Accepting commissions"
        />
      </FilterSection>

      <FilterSection title="Patron saint">
        <FilterChip
          label="Any"
          active={!activeSaint}
          onClick={() => setParam("saint", null)}
        />
        {saints.slice(0, 12).map((s) => (
          <FilterChip
            key={s.slug}
            label={s.name.replace(/^St\.\s/, "")}
            active={activeSaint === s.slug}
            onClick={() => setParam("saint", s.slug)}
          />
        ))}
      </FilterSection>

      {activeFilterCount > 0 && (
        <div className="pt-4 border-t border-ink/10 flex flex-wrap gap-1.5">
          {activeCategory !== "all" && (
            <Badge variant="burgundy">
              {categories.find((c) => c.slug === activeCategory)?.shortName}
            </Badge>
          )}
          {priceBand !== "any" && (
            <Badge variant="gold">
              {PRICE_BANDS.find((b) => b.id === priceBand)?.label}
            </Badge>
          )}
          {acceptingOnly && <Badge variant="olive">Accepting now</Badge>}
          {verifiedOnly && <Badge variant="olive">Pastor-endorsed</Badge>}
          {activeSaint && (
            <Badge variant="lapis">
              {saintBySlug(activeSaint)?.name.replace(/^St\.\s/, "")}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "h-5 w-5 rounded-sm border border-ink/25 grid place-items-center transition-colors shrink-0",
          checked ? "bg-burgundy-500 border-burgundy-500" : "bg-parchment-50",
        )}
        aria-hidden
      >
        {checked && (
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3 text-parchment-50"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8 L7 12 L13 4" />
          </svg>
        )}
      </span>
      <span className="font-serif text-base text-ink">{label}</span>
    </label>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-3">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
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
      className={cn(
        "rounded-full px-3 py-1.5 font-sans text-xs tracking-wide transition-colors focusable",
        active
          ? "bg-burgundy-500 text-parchment-50"
          : "bg-parchment-100 text-ink-soft hover:bg-parchment-200/70",
      )}
    >
      {label}
    </button>
  );
}
