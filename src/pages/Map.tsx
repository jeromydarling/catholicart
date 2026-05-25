import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, MapPin, Search, ShieldCheck } from "lucide-react";
import { artists, isVerified } from "../data/artists";
import { tagsFor, listDioceses, artistsByDiocese } from "../data/artist-tags";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { initials } from "../lib/utils";
import { MapboxMap } from "../components/MapboxMap";
import { Seo } from "../components/Seo";

export default function MapPage() {
  const [query, setQuery] = useState("");
  const [selectedDiocese, setSelectedDiocese] = useState<string | null>(null);
  const dioceses = useMemo(() => listDioceses(), []);

  const filteredDioceses = useMemo(() => {
    if (!query.trim()) return dioceses;
    const q = query.toLowerCase();
    return dioceses.filter((d) => d.diocese.toLowerCase().includes(q));
  }, [dioceses, query]);

  return (
    <PageShell>
      <Seo
        title="Map of the Body of Christ — Catholic artists worldwide"
        description="Every Ars Sacra guild artist is rooted in a particular church — a real parish, a real diocese, a real bishop. Find a hand near you, or commission across the world."
        path="/map"
      />
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          The geography of the guild
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          Map of the Body of Christ
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl leading-relaxed">
          Every artist is rooted in a particular church — a real parish, a
          real diocese, a real bishop. Find a hand near you, or commission
          across the world.
        </p>
        <Ornament className="my-8" />
      </section>

      {/* Mapbox map */}
      <section className="container">
        <MapboxMap
          className="h-[60dvh] min-h-[420px] max-h-[720px]"
          selectedDiocese={selectedDiocese}
          onSelect={(s) => setSelectedDiocese(s?.diocese ?? null)}
        />
        <p className="mt-3 font-serif text-xs italic text-ink-muted text-center">
          Pins land at each diocese's cathedral. Click a pin or pick a diocese below to scope the guild to that church.
        </p>
      </section>

      <section className="container mt-12 max-w-md">
        <label htmlFor="diocese-search" className="sr-only">
          Search dioceses
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted"
            aria-hidden
          />
          <Input
            id="diocese-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dioceses…"
            className="pl-9"
          />
        </div>
      </section>

      <section className="container mt-8 sm:mt-10 pb-20 space-y-12">
        {filteredDioceses.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink/15 p-8 text-center">
            <p className="font-serif text-ink-muted">
              No dioceses match "{query}".
            </p>
          </div>
        ) : (
          filteredDioceses.map(({ diocese, count }, idx) => {
            const list = artistsByDiocese(diocese);
            const selected = selectedDiocese === diocese;
            return (
              <motion.div
                key={diocese}
                id={`diocese-${diocese.replace(/\s+/g, "-").toLowerCase()}`}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                className={
                  selected
                    ? "rounded-md ring-2 ring-burgundy-500/40 bg-burgundy-500/5 -mx-2 px-2 py-3 sm:-mx-4 sm:px-4 sm:py-5"
                    : ""
                }
              >
                <button
                  type="button"
                  onClick={() => setSelectedDiocese(selected ? null : diocese)}
                  className="w-full text-left"
                >
                  <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Diocese
                      </div>
                      <h2 className="mt-1 font-display text-2xl sm:text-3xl text-ink">
                        {diocese}
                      </h2>
                    </div>
                    <div className="font-sans text-xs uppercase tracking-[0.22em] text-ink-muted tabular-nums">
                      {count} {count === 1 ? "artist" : "artists"}
                    </div>
                  </div>
                </button>
                <ul className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((a) => {
                    const cat = categoryBySlug(a.categories[0]);
                    return (
                      <li key={a.slug}>
                        <Link
                          to={`/artists/${a.slug}`}
                          className="flex items-start gap-3 rounded-md border border-ink/10 bg-parchment-50 shadow-card p-4 hover:shadow-plate transition-shadow focusable"
                        >
                          <div
                            className="h-12 w-12 rounded-full grid place-items-center text-parchment-50 font-display text-base shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${a.portraitFrom}, ${a.portraitTo})`,
                            }}
                          >
                            {initials(a.name)}
                          </div>
                          <div className="grow min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="font-display text-base text-ink truncate">
                                {a.name}
                              </div>
                              {isVerified(a) && (
                                <ShieldCheck className="h-3.5 w-3.5 text-olive-600 shrink-0" />
                              )}
                            </div>
                            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted truncate">
                              {cat?.shortName} · {a.city}
                            </div>
                            {tagsFor(a.slug).saintSlugs[0] && (
                              <Badge variant="lapis" className="mt-2">
                                Often depicts {prettySaint(tagsFor(a.slug).saintSlugs[0])}
                              </Badge>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-ink-muted shrink-0 mt-1" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            );
          })
        )}
      </section>

      <section className="container pb-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "The Church is universal precisely because she is local. The hand
          that paints in Pittsburgh and the hand that carves in São Paulo
          are members of the same body."
        </p>
      </section>
    </PageShell>
  );
}

function prettySaint(slug: string) {
  const map: Record<string, string> = {
    mary: "Our Lady",
    "guadalupe": "Guadalupe",
    "joseph": "St. Joseph",
    "michael": "St. Michael",
    "francis": "St. Francis",
    "therese": "St. Thérèse",
    "patrick": "St. Patrick",
    "jpii": "JPII",
    "kolbe": "St. Maximilian",
    "padre-pio": "Padre Pio",
    "augustine": "St. Augustine",
    "anthony": "St. Anthony",
    "cecilia": "St. Cecilia",
    "catherine-siena": "St. Catherine",
    "bernadette": "St. Bernadette",
    "thomas-aquinas": "St. Thomas Aquinas",
    "faustina": "St. Faustina",
    "john-vianney": "Curé d'Ars",
    "john-baptist": "John the Baptist",
    "peter-paul": "Peter & Paul",
  };
  return map[slug] ?? slug;
}

artists; // keep import live; helps tree-shake reasoning
