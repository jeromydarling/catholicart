import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ORDERS, artistsByOrder, tagsFor } from "../data/artist-tags";
import { isVerified } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Badge } from "../components/ui/badge";
import { initials } from "../lib/utils";

// Religious-order collections. Curated views of the guild grouped by
// each order's distinctive charism — the seamless garment, made visible.
export default function Orders() {
  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Religious orders
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          The orders, working.
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl leading-relaxed">
          Members of religious communities who keep the workshops of the
          tradition alive. Their charism is visible in their hand.
        </p>
        <Ornament className="my-10" />
      </section>

      <section className="container pb-20 space-y-16">
        {ORDERS.map((order, idx) => {
          const list = artistsByOrder(order.slug);
          if (list.length === 0) return null;
          return (
            <motion.div
              key={order.slug}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: idx * 0.04 }}
            >
              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                  <div
                    className="aspect-[3/4] rounded-md overflow-hidden relative shadow-card border border-ink/10"
                    style={{
                      background: `linear-gradient(135deg, ${order.paletteFrom}, ${order.paletteTo})`,
                    }}
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
                    <div className="absolute inset-0 grid place-items-center text-parchment-50/85">
                      <svg viewBox="0 0 200 240" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.65">
                        <path d="M100 30 v180 M50 90 h100" />
                      </svg>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-5 text-parchment-50">
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] opacity-80">
                        Order
                      </div>
                      <div
                        className="mt-1 font-display italic text-2xl leading-tight tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]"
                        style={{ textWrap: "balance" } as React.CSSProperties}
                      >
                        {order.name}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-8">
                  <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
                    {order.name}
                  </h2>
                  <p className="mt-3 font-serif italic text-base text-ink-soft max-w-prose leading-relaxed">
                    {order.charism}
                  </p>
                  <div className="mt-5 font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted tabular-nums">
                    {list.length} {list.length === 1 ? "artist" : "artists"}
                  </div>
                  <ul className="mt-4 grid sm:grid-cols-2 gap-3">
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
                                  {a.honorific ? `${a.honorific} ` : ""}
                                  {a.name}
                                </div>
                                {isVerified(a) && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-olive-600 shrink-0" />
                                )}
                              </div>
                              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted truncate">
                                {cat?.shortName} · {a.city}
                              </div>
                              {tagsFor(a.slug).diocese && (
                                <Badge variant="lapis" className="mt-2">
                                  {tagsFor(a.slug).diocese}
                                </Badge>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-ink-muted shrink-0 mt-1" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="container my-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "The Spirit gives gifts to each as he wills, for the building up
          of the body." — 1 Cor 12
        </p>
      </section>
    </PageShell>
  );
}
