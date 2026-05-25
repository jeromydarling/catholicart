import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Filter, Heart, MapPin, Search, Scale, X } from "lucide-react";
import { artists, isVerified } from "../data/artists";
import { categories } from "../data/categories";
import { saints, saintBySlug } from "../data/saints";
import { tagsFor } from "../data/artist-tags";
import type { Artist, CategorySlug } from "../types";
import { PageShell } from "../components/layout/PageShell";
import { ArtistCard } from "../components/ArtistCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Ornament } from "../components/Ornament";
import { cn } from "../lib/utils";
import { searchArtists } from "../lib/search";
import {
  COMPARE_MAX,
  getCompareList,
  getSaved,
  isInCompare,
  isSaved,
  subscribeSaved,
  toggleCompare,
  toggleSaved,
} from "../lib/saved";
import { useStore } from "../lib/store";
import { Seo } from "../components/Seo";

const PRICE_BANDS = [
  { id: "any", label: "Any price", min: 0, max: Number.POSITIVE_INFINITY },
  { id: "small", label: "Under $1,500", min: 0, max: 1500 },
  { id: "mid", label: "$1,500 – $7,500", min: 1500, max: 7500 },
  { id: "major", label: "Above $7,500", min: 7500, max: Number.POSITIVE_INFINITY },
] as const;

type PriceId = typeof PRICE_BANDS[number]["id"];

const SORTS = [
  { id: "relevance", label: "Most relevant" },
  { id: "popular", label: "Most commissioned" },
  { id: "price-asc", label: "Price · low → high" },
  { id: "price-desc", label: "Price · high → low" },
  { id: "newest", label: "Newly active" },
] as const;
type SortId = typeof SORTS[number]["id"];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => getSaved());
  const [compareSlugs, setCompareSlugs] = useState<string[]>(() => getCompareList());
  const { commissions } = useStore();

  // Subscribe to saved/compare changes
  useEffect(() => {
    const un = subscribeSaved(() => {
      setSaved(getSaved());
      setCompareSlugs(getCompareList());
    });
    return un;
  }, []);

  const query = params.get("q") || "";
  const sortId = (params.get("sort") || "relevance") as SortId;
  const activeCategory = (params.get("category") || "all") as
    | "all"
    | CategorySlug;
  const acceptingOnly = params.get("accepting") === "true";
  const verifiedOnly = params.get("verified") === "true";
  const priceBand = (params.get("price") || "any") as PriceId;
  const activeSaint = params.get("saint") || "";
  const activeSaintInfo = activeSaint ? saintBySlug(activeSaint) : undefined;
  const savedOnly = params.get("saved") === "true";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "all" || value === "any" || value === "" || value === "relevance") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  // Popularity index: commissions per artist (delivered + in-flight)
  const popularity = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of commissions) m.set(c.artistSlug, (m.get(c.artistSlug) ?? 0) + 1);
    return m;
  }, [commissions]);

  // Most-recent activity per artist (newest commission timestamp)
  const recencyMs = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of commissions) {
      const t = new Date(c.completedAt ?? c.createdAt).getTime();
      m.set(c.artistSlug, Math.max(t, m.get(c.artistSlug) ?? 0));
    }
    return m;
  }, [commissions]);

  const filtered = useMemo(() => {
    const band = PRICE_BANDS.find((b) => b.id === priceBand)!;
    // 1. apply filters
    const filtered = artists.filter((a) => {
      if (activeCategory !== "all" && !a.categories.includes(activeCategory))
        return false;
      if (acceptingOnly && !a.acceptingCommissions) return false;
      if (verifiedOnly && !isVerified(a)) return false;
      if (a.startingAt < band.min || a.startingAt > band.max) return false;
      if (activeSaint && !tagsFor(a.slug).saintSlugs.includes(activeSaint))
        return false;
      if (savedOnly && !saved.includes(a.slug)) return false;
      return true;
    });

    // 2. search (if query present)
    const searched = query.trim()
      ? searchArtists(filtered, query)
      : filtered.map((a) => ({ artist: a, score: 0, matches: [] as string[] }));

    // 3. sort
    const sorter = (a: Artist, b: Artist) => {
      switch (sortId) {
        case "popular":
          return (popularity.get(b.slug) ?? 0) - (popularity.get(a.slug) ?? 0);
        case "price-asc":
          return a.startingAt - b.startingAt;
        case "price-desc":
          return b.startingAt - a.startingAt;
        case "newest":
          return (recencyMs.get(b.slug) ?? 0) - (recencyMs.get(a.slug) ?? 0);
        case "relevance":
        default:
          return 0;
      }
    };
    if (sortId !== "relevance" || !query.trim()) {
      searched.sort((x, y) => sorter(x.artist, y.artist));
    }

    return searched;
  }, [activeCategory, acceptingOnly, verifiedOnly, priceBand, activeSaint, savedOnly, saved, query, sortId, popularity, recencyMs]);

  const activeFilterCount =
    (activeCategory !== "all" ? 1 : 0) +
    (acceptingOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (priceBand !== "any" ? 1 : 0) +
    (activeSaint ? 1 : 0) +
    (savedOnly ? 1 : 0);

  return (
    <PageShell>
      <Seo
        title="Browse the guild — Catholic artists accepting commissions"
        description="Read each pastor-endorsed Catholic artist's vocation, study their portfolios, filter by craft, saint, diocese, and price. Compare side-by-side."
        path="/browse"
      />
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
          <button
            type="button"
            onClick={() => setParam("saved", savedOnly ? null : "true")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.18em] focusable transition-colors",
              savedOnly
                ? "bg-burgundy-500 text-parchment-50 border border-burgundy-500"
                : "border border-ink/15 bg-parchment-50 text-ink-soft hover:bg-parchment-100",
            )}
          >
            <Heart className={cn("h-3 w-3", savedOnly && "fill-current")} />
            Saved ({saved.length})
          </button>
        </div>

        {/* Search + sort row */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <label htmlFor="browse-search" className="sr-only">
            Search the guild
          </label>
          <div className="relative grow">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted"
              aria-hidden
            />
            <Input
              id="browse-search"
              type="search"
              value={query}
              onChange={(e) => setParam("q", e.target.value || null)}
              placeholder="Search by name, craft, saint, parish, place…"
              className="pl-9 h-12"
            />
          </div>
          <label htmlFor="browse-sort" className="sr-only">
            Sort
          </label>
          <select
            id="browse-sort"
            value={sortId}
            onChange={(e) => setParam("sort", e.target.value || null)}
            className="h-12 rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable sm:w-56"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
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
              {filtered.map((s, i) => (
                <ArtistCardWithActions
                  key={s.artist.slug}
                  artist={s.artist}
                  index={i}
                  matches={s.matches}
                  isSavedNow={saved.includes(s.artist.slug)}
                  isCompareNow={compareSlugs.includes(s.artist.slug)}
                  canAddMoreCompare={compareSlugs.length < COMPARE_MAX}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Sticky compare tray */}
      {compareSlugs.length > 0 && (
        <CompareTray slugs={compareSlugs} />
      )}

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

// Wraps ArtistCard with heart (save) + compare-checkbox overlays.
function ArtistCardWithActions({
  artist,
  index,
  matches,
  isSavedNow,
  isCompareNow,
  canAddMoreCompare,
}: {
  artist: Artist;
  index: number;
  matches: string[];
  isSavedNow: boolean;
  isCompareNow: boolean;
  canAddMoreCompare: boolean;
}) {
  return (
    <div className="relative group">
      <ArtistCard artist={artist} index={index} />
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <button
          type="button"
          aria-label={isSavedNow ? `Unsave ${artist.name}` : `Save ${artist.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSaved(artist.slug);
          }}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-full backdrop-blur-sm focusable transition-colors",
            isSavedNow
              ? "bg-burgundy-500 text-parchment-50"
              : "bg-parchment-50/85 text-ink-soft hover:bg-parchment-50",
          )}
        >
          <Heart className={cn("h-4 w-4", isSavedNow && "fill-current")} />
        </button>
        <button
          type="button"
          aria-label={isCompareNow ? `Remove ${artist.name} from compare` : `Add ${artist.name} to compare`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isCompareNow && !canAddMoreCompare) return;
            toggleCompare(artist.slug);
          }}
          disabled={!isCompareNow && !canAddMoreCompare}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-full backdrop-blur-sm focusable transition-colors",
            isCompareNow
              ? "bg-ink text-parchment-50"
              : "bg-parchment-50/85 text-ink-soft hover:bg-parchment-50 disabled:opacity-40",
          )}
        >
          <Scale className="h-4 w-4" />
        </button>
      </div>
      {matches.length > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="gold" className="bg-parchment-50/90 text-burgundy-600 backdrop-blur-sm">
            Matched · {matches.join(", ")}
          </Badge>
        </div>
      )}
    </div>
  );
}

function CompareTray({ slugs }: { slugs: string[] }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl">
      <div className="rounded-md border border-ink/15 bg-parchment-50/95 backdrop-blur-md shadow-plate p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
        <Scale className="h-5 w-5 text-burgundy-500 shrink-0" />
        <div className="grow min-w-0">
          <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            Comparing {slugs.length} · max {COMPARE_MAX}
          </div>
          <div className="font-display text-base text-ink truncate">
            {slugs.map((s) => artists.find((a) => a.slug === s)?.name).filter(Boolean).join(" · ")}
          </div>
        </div>
        <Button asChild size="sm">
          <Link to={`/compare?slugs=${slugs.join(",")}`}>
            View side-by-side
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Silence unused-var warnings for things we keep imported for clarity
isSaved; isInCompare;
