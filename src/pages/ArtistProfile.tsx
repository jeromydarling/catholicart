import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Award, Compass, Hourglass, ShieldCheck } from "lucide-react";
import { artistBySlug, isVerified } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ArtworkPlate } from "../components/ArtworkPlate";
import { Ornament } from "../components/Ornament";
import { formatPrice, initials } from "../lib/utils";

export default function ArtistProfile() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const artist = artistBySlug(slug);

  if (!artist) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl">Artist not found</h1>
          <p className="mt-3 font-serif text-ink-muted">
            The artist you sought is not in our guild.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/browse">Browse the guild</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const cats = artist.categories.map((s) => categoryBySlug(s)!);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(180deg, ${artist.portraitFrom}22 0%, transparent 60%)`,
          }}
        />
        <div className="container pt-12 sm:pt-16">
          <div className="mb-6 font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            <Link to="/browse" className="hover:text-burgundy-500">
              Browse
            </Link>{" "}
            <span className="mx-2">›</span> {cats[0]?.name}
          </div>
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7"
            >
              <div className="flex flex-wrap gap-2 mb-5">
                {cats.map((c) => (
                  <Badge key={c.slug} variant="burgundy">
                    {c.name}
                  </Badge>
                ))}
                {artist.acceptingCommissions ? (
                  <Badge variant="olive">Accepting commissions</Badge>
                ) : (
                  <Badge variant="outline">Not currently booking</Badge>
                )}
                {isVerified(artist) && (
                  <Badge
                    variant="olive"
                    className="inline-flex items-center gap-1"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Pastor-endorsed
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
                {artist.honorific && (
                  <span className="text-ink-muted text-3xl sm:text-4xl mr-2">
                    {artist.honorific}
                  </span>
                )}
                {artist.name}
              </h1>
              <div className="mt-4 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
                {artist.city} · {artist.region}
                {artist.patron && (
                  <>
                    {" "}
                    <span className="mx-2 text-gold-500">✦</span> Patron:{" "}
                    {artist.patron}
                  </>
                )}
              </div>

              <Ornament className="my-7" />

              <p
                className="font-display italic text-2xl sm:text-3xl text-ink leading-snug max-w-2xl"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                “{artist.vocationStatement}”
              </p>

              {artist.verification && isVerified(artist) && (
                <div className="mt-7 rounded-md border border-olive-500/30 bg-olive-500/5 p-4 sm:p-5 max-w-2xl">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-olive-500 text-parchment-50">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="grow">
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-olive-600 mb-0.5">
                        Pastor-endorsed
                      </div>
                      <div className="font-display text-lg sm:text-xl text-ink leading-tight">
                        {artist.verification.verifierName}
                      </div>
                      <div className="font-serif text-sm text-ink-soft mt-0.5">
                        {artist.verification.parishOrCommunity}
                      </div>
                      <div className="mt-2 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                        Endorsed{" "}
                        {artist.verification.endorsedAt
                          ? new Date(
                              artist.verification.endorsedAt,
                            ).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                            })
                          : "—"}
                        {artist.verification.status ===
                          "chancery-confirmed" && (
                          <>
                            {" · "}Chancery confirmed (
                            {artist.verification.diocese})
                          </>
                        )}
                        {artist.verification.status ===
                          "endorsed-chancery-pending" && (
                          <>
                            {" · "}Awaiting chancery confirmation (
                            {artist.verification.diocese})
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {artist.verification?.status === "pending" && (
                <div className="mt-7 rounded-md border border-gold-500/40 bg-gold-500/5 p-4 sm:p-5 max-w-2xl">
                  <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-1">
                    Pending pastor endorsement
                  </div>
                  <p className="font-serif text-sm text-ink-soft leading-snug">
                    Awaiting endorsement from{" "}
                    {artist.verification.verifierName} (
                    {artist.verification.parishOrCommunity}). The profile is
                    visible while we wait, but cannot accept new commissions
                    until the endorsement is recorded.
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  disabled={!artist.acceptingCommissions}
                >
                  <Link to={`/commission/${artist.slug}`}>
                    Begin a commission{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {artist.customPricing && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                  >
                    <Link to={`/commission/${artist.slug}?custom=true`}>
                      Request a custom quote
                    </Link>
                  </Button>
                )}
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                <Stat
                  icon={<Hourglass className="h-4 w-4" />}
                  label="Practicing"
                  value={`${artist.yearsPracticing} yrs`}
                />
                <Stat
                  icon={<Compass className="h-4 w-4" />}
                  label="Starting at"
                  value={formatPrice(artist.startingAt)}
                />
                <Stat
                  icon={<Award className="h-4 w-4" />}
                  label="Custom"
                  value={artist.customPricing ? "Welcome" : "Tiers only"}
                />
              </div>
            </motion.div>

            {/* Portrait card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div
                className="aspect-[4/5] rounded-md shadow-plate overflow-hidden border border-ink/10 relative"
                style={{
                  background: `linear-gradient(160deg, ${artist.portraitFrom} 0%, ${artist.portraitTo} 100%)`,
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-40 mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
                  }}
                />
                <div className="absolute inset-5 sm:inset-6 rounded border border-parchment-50/15" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-32 w-32 sm:h-40 sm:w-40 place-items-center rounded-full bg-parchment-50/10 ring-1 ring-parchment-50/30 backdrop-blur-[2px]">
                    <span className="font-display text-5xl sm:text-6xl text-parchment-50 tracking-wide">
                      {initials(artist.name)}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 text-parchment-50 text-center">
                  <div className="font-display italic text-lg">
                    {artist.honorific ? `${artist.honorific} ` : ""}
                    {artist.name}
                  </div>
                  <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] opacity-80">
                    {cats[0]?.name}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="container mt-14 sm:mt-20">
        <Tabs defaultValue="portfolio">
          <TabsList>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {artist.works.map((w) => (
                <ArtworkPlate key={w.id} artwork={w} aspect="portrait" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about">
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 max-w-2xl">
                {artist.bio.map((p, i) => (
                  <p
                    key={i}
                    className="font-serif text-lg text-ink leading-relaxed mb-5 first:drop-cap"
                  >
                    {p}
                  </p>
                ))}
              </div>
              <aside className="lg:col-span-5">
                <div className="rounded-md border border-ink/10 bg-parchment-100/50 p-6">
                  <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-600 mb-3">
                    Formation
                  </div>
                  <ul className="space-y-3">
                    {artist.formation.map((line) => (
                      <li
                        key={line}
                        className="font-serif text-base text-ink-soft border-l-2 border-gold-500/40 pl-4"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="tiers">
            <div className="grid md:grid-cols-3 gap-5">
              {artist.tiers.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-6 flex flex-col"
                >
                  <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-600">
                    Tier {i + 1}
                  </div>
                  <h3 className="mt-2 font-display text-2xl text-ink">
                    {t.name}
                  </h3>
                  <div className="mt-2 font-display text-3xl text-burgundy-500">
                    {formatPrice(t.startingAt)}
                    <span className="text-sm text-ink-muted font-sans align-baseline ml-1">
                      starting
                    </span>
                  </div>
                  <p className="mt-3 font-serif text-base text-ink-soft leading-snug">
                    {t.description}
                  </p>
                  <div className="mt-4 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
                    Turnaround: {t.turnaroundWeeks[0]}–
                    {t.turnaroundWeeks[1]} weeks
                  </div>
                  <ul className="mt-5 space-y-2 grow">
                    {t.includes.map((line) => (
                      <li
                        key={line}
                        className="flex gap-2 font-serif text-sm text-ink-soft leading-snug"
                      >
                        <span className="text-gold-500 mt-1">✦</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() =>
                      navigate(
                        `/commission/${artist.slug}?tier=${t.id}`,
                      )
                    }
                    className="mt-6"
                    variant={i === 1 ? "default" : "outline"}
                    disabled={!artist.acceptingCommissions}
                  >
                    Begin
                  </Button>
                </motion.div>
              ))}
            </div>
            {artist.customPricing && (
              <div className="mt-6 rounded-md border border-dashed border-ink/15 bg-parchment-100/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="font-display text-xl text-ink">
                    Don't see your commission?
                  </div>
                  <p className="mt-1 font-serif text-base text-ink-muted">
                    {artist.honorific ? `${artist.honorific} ` : ""}
                    {artist.name.split(" ")[0]} welcomes custom commissions
                    that fall outside these tiers.
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link to={`/commission/${artist.slug}?custom=true`}>
                    Request a custom quote
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 p-3">
      <div className="flex items-center gap-2 text-gold-600">
        {icon}
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          {label}
        </span>
      </div>
      <div className="mt-1 font-display text-base text-ink">{value}</div>
    </div>
  );
}
