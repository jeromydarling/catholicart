import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ShieldCheck, Trash2, X } from "lucide-react";
import { artists, isVerified } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { saintBySlug } from "../data/saints";
import { tagsFor } from "../data/artist-tags";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { formatPrice, initials } from "../lib/utils";
import { clearCompare, toggleCompare } from "../lib/saved";

// /compare?slugs=a,b,c — side-by-side detail for up to 4 artists.
export default function Compare() {
  const [params, setParams] = useSearchParams();
  const slugs = (params.get("slugs") ?? "").split(",").filter(Boolean);
  const list = useMemo(
    () =>
      slugs
        .map((s) => artists.find((a) => a.slug === s))
        .filter((a): a is NonNullable<typeof a> => !!a),
    [slugs],
  );

  function removeSlug(slug: string) {
    const next = slugs.filter((s) => s !== slug);
    if (next.length === 0) {
      setParams({}, { replace: true });
    } else {
      setParams({ slugs: next.join(",") }, { replace: true });
    }
    toggleCompare(slug);
  }

  if (list.length === 0) {
    return (
      <PageShell>
        <section className="container py-24 text-center max-w-xl">
          <h1 className="font-display text-4xl text-ink">Nothing to compare yet.</h1>
          <p className="mt-3 font-serif text-base text-ink-muted">
            Add 2–4 artists from the guild and view them side-by-side here.
          </p>
          <Button asChild className="mt-6">
            <Link to="/browse">Browse the guild</Link>
          </Button>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Side-by-side
        </div>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
            Comparing {list.length} {list.length === 1 ? "artist" : "artists"}.
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearCompare();
              setParams({}, { replace: true });
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear all
          </Button>
        </div>
        <Ornament className="my-8" />
      </section>

      <section className="container pb-20 overflow-x-auto">
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${list.length}, minmax(260px, 1fr))`,
          }}
        >
          {list.map((a) => {
            const cat = categoryBySlug(a.categories[0]);
            const tags = tagsFor(a.slug);
            const sample = a.works?.[0];
            return (
              <article
                key={a.slug}
                className="rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden flex flex-col"
              >
                {/* Header */}
                <header className="relative">
                  <div
                    className="aspect-[4/3] relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${a.portraitFrom}, ${a.portraitTo})`,
                    }}
                  >
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="grid h-20 w-20 place-items-center rounded-full bg-parchment-50/15 ring-1 ring-parchment-50/30">
                        <span className="font-display text-2xl text-parchment-50">
                          {initials(a.name)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${a.name} from compare`}
                      onClick={() => removeSlug(a.slug)}
                      className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-parchment-50/85 text-ink hover:bg-parchment-50 backdrop-blur-sm focusable"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                {/* Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <Link
                      to={`/artists/${a.slug}`}
                      className="font-display text-xl text-ink hover:text-burgundy-500"
                    >
                      {a.honorific ? `${a.honorific} ` : ""}
                      {a.name}
                    </Link>
                    <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                      {cat?.shortName} · {a.city}
                    </div>
                    {isVerified(a) && (
                      <Badge variant="olive" className="mt-2">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Endorsed
                      </Badge>
                    )}
                  </div>

                  <Row label="Starting at" value={formatPrice(a.startingAt)} emphasize />
                  <Row label="Turnaround" value={`${a.tiers[0]?.turnaroundWeeks[0]}–${a.tiers[0]?.turnaroundWeeks[1]} weeks`} />
                  <Row
                    label="Accepting now"
                    value={a.acceptingCommissions ? "Yes" : "Wait-listed"}
                  />
                  <Row label="Diocese" value={tags.diocese ?? "—"} />
                  <Row
                    label="Often depicts"
                    value={
                      tags.saintSlugs
                        .map((s) => saintBySlug(s)?.name.replace(/^St\.\s/, ""))
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(" · ") || "—"
                    }
                  />
                  <Row
                    label="Crafts"
                    value={a.categories
                      .map((c) => categoryBySlug(c)?.shortName)
                      .filter(Boolean)
                      .join(", ")}
                  />

                  {sample && (
                    <div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-2">
                        Sample
                      </div>
                      <div
                        className="aspect-[4/5] relative rounded-sm overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${sample.paletteFrom}, ${sample.paletteTo})`,
                        }}
                      >
                        <div className="absolute inset-2 border border-parchment-50/15" />
                        <div className="absolute inset-x-0 bottom-0 p-3 text-parchment-50 text-xs">
                          <div className="font-display italic">{sample.title}</div>
                          <div className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.18em] opacity-80">
                            {sample.medium}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button asChild className="w-full" size="sm">
                      <Link to={`/commission/${a.slug}`}>
                        Commission {a.name.split(" ").slice(-1)[0]}
                        <ArrowRight className="h-3.5 w-3.5 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="border-t border-ink/10 pt-3">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </div>
      <div
        className={
          emphasize
            ? "mt-1 font-display text-xl text-burgundy-500 tabular-nums"
            : "mt-1 font-serif text-sm text-ink-soft"
        }
      >
        {value}
      </div>
    </div>
  );
}
