import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  Award,
  Compass,
  ExternalLink,
  Hourglass,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { artistBySlug, isVerified } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ArtworkPlate } from "../components/ArtworkPlate";
import { Ornament } from "../components/Ornament";
import { formatPrice, initials } from "../lib/utils";
import { similarArtists } from "../lib/recommend";
import { useStore } from "../lib/store";
import { StarRating } from "../components/StarRating";
import { Seo } from "../components/Seo";
import { feastsForLiturgicalYear } from "../lib/liturgical";

interface LiveProfile {
  mission_statement: string;
  studio_rhythm: string;
  process_note: string;
  vocation_statement: string;
  instagram_handle: string;
  x_handle: string;
  personal_url: string;
  profile_published: boolean;
  sabbatical_until: string;
  trained_under: string;
  trained_under_slug: string;
  working_toward_feasts: string[];
  /** true when the signed-in user can edit this profile */
  is_owner: boolean;
}

interface PatronFamily {
  household: string;
  domain: string;
  commissions: number;
  first_year: string;
  last_year: string;
}

export default function ArtistProfile() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const artist = artistBySlug(slug);
  const [live, setLive] = useState<LiveProfile | null>(null);
  const [house, setHouse] = useState<{ count: number; mine: boolean } | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [families, setFamilies] = useState<PatronFamily[]>([]);

  // Pull the live profile fields from the API. Failures are silent —
  // the page still renders from the seed data. Owner detection is
  // server-implied: we attempt the questionnaire endpoint; if it
  // returns 200, the signed-in user owns this artist.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [aRes, qRes, hRes, meRes, pfRes] = await Promise.all([
        api.artist(slug),
        api.questionnaire(slug),
        api.houseStatus(slug),
        api.me(),
        api.patronFamilies(slug),
      ]);
      if (cancelled) return;
      if (hRes.ok) setHouse(hRes.data);
      if (meRes.ok) setSignedIn(Boolean(meRes.data.user));
      if (pfRes.ok) setFamilies(pfRes.data.families);
      if (cancelled) return;
      if (!aRes.ok) return;
      const a = aRes.data.artist as Record<string, unknown>;
      setLive({
        mission_statement: (a.mission_statement as string) ?? "",
        studio_rhythm: (a.studio_rhythm as string) ?? "",
        process_note: (a.process_note as string) ?? "",
        vocation_statement: (a.vocation_statement as string) ?? "",
        instagram_handle: (a.instagram_handle as string) ?? "",
        x_handle: (a.x_handle as string) ?? "",
        personal_url: (a.personal_url as string) ?? "",
        profile_published: Boolean(a.profile_published),
        sabbatical_until: (a.sabbatical_until as string) ?? "",
        trained_under: (a.trained_under as string) ?? "",
        trained_under_slug: (a.trained_under_slug as string) ?? "",
        working_toward_feasts: Array.isArray(a.working_toward_feasts)
          ? (a.working_toward_feasts as string[])
          : [],
        is_owner: qRes.ok,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

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
  const bioText = Array.isArray(artist.bio) ? artist.bio.join(" ") : artist.bio ?? "";

  return (
    <PageShell>
      <Seo
        title={`${artist.honorific ? artist.honorific + " " : ""}${artist.name} · ${cats[0]?.shortName ?? "Artist"} · Ars Sacra`}
        description={`${cats[0]?.name ?? "Sacred art"} commissions by ${artist.name}, ${artist.city}. ${bioText.slice(0, 140)}`}
        path={`/artists/${artist.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: artist.name,
          honorificPrefix: artist.honorific ?? undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: artist.city,
            addressCountry: artist.region,
          },
          jobTitle: cats[0]?.name ?? "Artist",
          description: bioText.slice(0, 280),
          knowsAbout: cats.map((c) => c?.name),
          memberOf: {
            "@type": "Organization",
            name: "Ars Sacra",
            url: "https://catholicart.jer-f84.workers.dev",
          },
        }}
      />
      {/* Hero — the artist's own palette flows into every accent on
          the page via CSS custom properties, set once on the root and
          read by `.artist-accent` and `.artist-accent-soft` below. */}
      <style>{`
        .artist-page {
          --artist-from: ${artist.portraitFrom};
          --artist-to: ${artist.portraitTo};
        }
        .artist-page .artist-accent { color: var(--artist-from); }
        .artist-page .artist-rule { background: linear-gradient(to right, transparent, var(--artist-from), transparent); height: 1px; border: 0; }
      `}</style>
      <div className="artist-page">
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
                {(() => {
                  const onRetreat =
                    live?.sabbatical_until &&
                    new Date(live.sabbatical_until).getTime() > Date.now();
                  if (onRetreat) {
                    const back = new Date(live!.sabbatical_until).toLocaleDateString(
                      undefined,
                      { month: "long", day: "numeric" },
                    );
                    return <Badge variant="outline">On retreat · back {back}</Badge>;
                  }
                  return artist.acceptingCommissions ? (
                    <Badge variant="olive">Accepting commissions</Badge>
                  ) : (
                    <Badge variant="outline">Not currently booking</Badge>
                  );
                })()}
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
                {live?.trained_under && (
                  <div className="mt-1.5 normal-case tracking-normal text-[13px] font-serif italic text-ink-soft">
                    Trained under{" "}
                    {live.trained_under_slug ? (
                      <Link
                        to={`/artists/${live.trained_under_slug}`}
                        className="text-burgundy-500 hover:text-burgundy-600 not-italic font-medium"
                      >
                        {live.trained_under}
                      </Link>
                    ) : (
                      <span className="text-ink not-italic">{live.trained_under}</span>
                    )}
                  </div>
                )}
              </div>

              <Ornament className="my-7" />

              <p
                className="font-display italic text-2xl sm:text-3xl text-ink leading-snug max-w-2xl"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                “{(live?.profile_published && live.vocation_statement)
                  || artist.vocationStatement}”
              </p>

              {/* House artist patrons count + toggle. Encourages
                  patrons to formalize the relationship. */}
              {house && house.count > 0 && (
                <div className="mt-4 font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                  {house.count} {house.count === 1 ? "household calls" : "households call"} them their house artist
                </div>
              )}
              {signedIn && !live?.is_owner && (
                <div className="mt-3">
                  {house?.mine ? (
                    <Button
                      onClick={async () => {
                        await api.releaseHousePatron(slug);
                        const h = await api.houseStatus(slug);
                        if (h.ok) setHouse(h.data);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Release house artist designation
                    </Button>
                  ) : (
                    <Button
                      onClick={async () => {
                        await api.becomeHousePatron(slug);
                        const h = await api.houseStatus(slug);
                        if (h.ok) setHouse(h.data);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Make {artist.name.split(" ")[0]} my house artist
                    </Button>
                  )}
                </div>
              )}

              {/* Owner edit prompt — only the artist (or operator) sees this. */}
              {live?.is_owner && (
                <div className="mt-5 inline-flex items-center gap-3 rounded-md border border-dashed border-burgundy-500/30 bg-burgundy-500/5 px-4 py-2.5">
                  <Pencil className="h-4 w-4 text-burgundy-500" />
                  <span className="font-serif text-sm text-ink-soft">
                    This is your page.{" "}
                    <Link
                      to={`/artists/${slug}/edit`}
                      className="text-burgundy-500 hover:text-burgundy-600 underline underline-offset-2"
                    >
                      {live.profile_published
                        ? "Edit your vocation site"
                        : "Build your vocation site"}
                    </Link>
                  </span>
                </div>
              )}

              {/* Mission statement — appears when published. Set in
                  large display type, as the single line under the name. */}
              {live?.profile_published && live.mission_statement && (
                <p
                  className="mt-7 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed max-w-2xl"
                  style={{ textWrap: "balance" } as React.CSSProperties}
                >
                  {live.mission_statement}
                </p>
              )}

              {/* Socials row — when present. */}
              {live?.profile_published &&
                (live.instagram_handle || live.x_handle || live.personal_url) && (
                  <div className="mt-5 flex items-center gap-4 flex-wrap font-sans text-xs uppercase tracking-[0.18em]">
                    {live.instagram_handle && (
                      <a
                        href={`https://instagram.com/${live.instagram_handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-muted hover:text-burgundy-500 inline-flex items-center gap-1"
                      >
                        Instagram <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {live.x_handle && (
                      <a
                        href={`https://x.com/${live.x_handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-muted hover:text-burgundy-500 inline-flex items-center gap-1"
                      >
                        X <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {live.personal_url && (
                      <a
                        href={live.personal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-muted hover:text-burgundy-500 inline-flex items-center gap-1"
                      >
                        Their own site <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

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
                {live?.sabbatical_until &&
                new Date(live.sabbatical_until).getTime() > Date.now() ? (
                  <Button asChild size="lg" variant="outline">
                    <Link to={`/commission/${artist.slug}`}>
                      Leave a letter for when they return
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
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
                      <Button asChild variant="outline" size="lg">
                        <Link to={`/commission/${artist.slug}?custom=true`}>
                          Request a custom quote
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
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
                <AvailabilityStat slug={artist.slug} />
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

      {/* The artist's own words — appears when they've published a
          vocation site. The studio rhythm and process note sit before
          the portfolio so the work is framed by the hand that makes
          it, not the other way around. */}
      {live?.profile_published && (live.studio_rhythm || live.process_note) && (
        <section className="container mt-14 sm:mt-20 max-w-3xl">
          <Ornament className="mb-10" />
          {live.studio_rhythm && (
            <div className="mb-12">
              <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
                The studio rhythm
              </div>
              <p
                className="font-serif text-lg sm:text-xl text-ink leading-relaxed whitespace-pre-line"
                style={{ textWrap: "pretty" } as React.CSSProperties}
              >
                {live.studio_rhythm}
              </p>
            </div>
          )}
          {live.process_note && (
            <div>
              <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
                Formation & process
              </div>
              <div
                className="font-serif text-base sm:text-lg text-ink-soft leading-relaxed space-y-4"
                style={{ textWrap: "pretty" } as React.CSSProperties}
              >
                {live.process_note.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Working toward — when the artist has open feast windows. */}
      {live?.profile_published && live.working_toward_feasts.length > 0 && (
        <FeastWorkingTowardStrip slugs={live.working_toward_feasts} />
      )}

      {/* Patron families — recurring households. */}
      {families.length > 0 && (
        <section className="container mt-12 max-w-3xl">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
            Recurring households
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {families.map((f, i) => (
              <li
                key={i}
                className="rounded-md border border-ink/10 bg-parchment-50 p-4"
              >
                <div className="font-display text-base text-ink">
                  The {f.household} household
                </div>
                <div className="mt-1 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted tabular-nums">
                  {f.commissions} commissions · {f.first_year}
                  {f.last_year !== f.first_year && `–${f.last_year}`}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <ReviewsSection slug={artist.slug} />
      <SimilarArtists slug={artist.slug} />
      </div>
    </PageShell>
  );
}

function SimilarArtists({ slug }: { slug: string }) {
  const similar = similarArtists(slug, 4);
  if (similar.length === 0) return null;
  return (
    <section className="container my-20 sm:my-28">
      <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
        Similar hands
      </div>
      <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight mb-6">
        Other artists in this tradition
      </h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {similar.map((a) => {
          const cat = categoryBySlug(a.categories[0]);
          return (
            <li key={a.slug}>
              <Link
                to={`/artists/${a.slug}`}
                className="block rounded-md border border-ink/10 bg-parchment-50 shadow-card p-4 hover:shadow-plate transition-shadow focusable"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-12 w-12 rounded-full grid place-items-center text-parchment-50 font-display text-base shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${a.portraitFrom}, ${a.portraitTo})`,
                    }}
                  >
                    {initials(a.name)}
                  </div>
                  <div className="grow min-w-0">
                    <div className="font-display text-base text-ink truncate">
                      {a.name}
                    </div>
                    <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted truncate">
                      {cat?.shortName} · {a.city}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
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

function ReviewsSection({ slug }: { slug: string }) {
  const store = useStore();
  const reviews = store.reviewsForArtist(slug);
  const commissions = store.commissions.filter((c) => c.artistSlug === slug);
  const delivered = commissions.filter(
    (c) => c.stage === "delivered" || c.stage === "blessed",
  );

  // Track-record metrics
  const totalDelivered = delivered.length;
  const onTime = delivered.filter((c) => {
    if (!c.preferredDeadline || !c.completedAt) return true;
    return new Date(c.completedAt).getTime() <= new Date(c.preferredDeadline).getTime();
  }).length;
  const onTimePct = totalDelivered > 0 ? Math.round((onTime / totalDelivered) * 100) : null;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;
  const avgTurnaroundWeeks = (() => {
    const completed = delivered.filter((c) => c.completedAt);
    if (completed.length === 0) return null;
    const total = completed.reduce((s, c) => {
      const start = new Date(c.createdAt).getTime();
      const end = new Date(c.completedAt!).getTime();
      return s + (end - start);
    }, 0);
    return Math.round(total / completed.length / (1000 * 60 * 60 * 24 * 7));
  })();

  if (totalDelivered === 0 && reviews.length === 0) return null;

  return (
    <section className="container my-20 sm:my-28">
      <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
        Track record
      </div>
      <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight mb-6">
        The patron's evidence
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <MetricCard label="Commissions delivered" value={totalDelivered.toString()} />
        <MetricCard
          label="On-time"
          value={onTimePct != null ? `${onTimePct}%` : "—"}
        />
        <MetricCard
          label="Avg turnaround"
          value={avgTurnaroundWeeks != null ? `${avgTurnaroundWeeks} wk` : "—"}
        />
        <MetricCard
          label="Avg rating"
          value={
            avgRating != null ? (
              <span className="flex items-center gap-2 tabular-nums">
                {avgRating.toFixed(1)}
                <StarRating value={avgRating} size="sm" />
              </span>
            ) : (
              "—"
            )
          }
        />
      </div>

      {reviews.length > 0 ? (
        <ul className="space-y-5">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <StarRating value={r.rating} size="sm" />
                  <span className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted tabular-nums">
                    {r.rating}/5
                  </span>
                </div>
                <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  {r.patronName} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <p className="mt-3 font-serif text-base text-ink-soft leading-relaxed italic">
                "{r.body}"
              </p>
              {r.artistReply && (
                <div className="mt-4 pt-4 border-t border-ink/10">
                  <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-1.5">
                    Reply from the artist
                  </div>
                  <p className="font-serif text-sm text-ink-soft leading-relaxed">
                    {r.artistReply.body}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed border-ink/15 p-8 text-center">
          <p className="font-serif text-ink-muted">
            Patrons haven't written reviews yet. The artist's track record above is the
            evidence so far.
          </p>
        </div>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-4 sm:p-5">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl text-ink leading-none">
        {value}
      </div>
    </div>
  );
}

// Computes "Accepting" / "In demand" / "Full" from in-flight load + month overrides.
function AvailabilityStat({ slug }: { slug: string }) {
  const store = useStore();
  const avail = store.getAvailability(slug);
  const cap = avail?.concurrentCap ?? 3;
  const inFlight = store.commissions.filter(
    (c) =>
      c.artistSlug === slug &&
      c.stage !== "delivered" &&
      c.stage !== "blessed" &&
      c.stage !== "cancelled",
  ).length;
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthStatus = avail?.months[monthKey] ?? "accepting";

  let label = "Accepting";
  let value = `${inFlight} in flight`;
  if (monthStatus === "away") {
    label = "Away";
    value = "Resumes next month";
  } else if (monthStatus === "full" || inFlight >= cap) {
    label = "Currently full";
    value = `${inFlight}/${cap} active`;
  } else if (inFlight >= cap - 1) {
    label = "In demand";
    value = `${inFlight}/${cap} active`;
  }
  return (
    <div className="flex items-start gap-2 rounded-md bg-parchment-100 px-3 py-2.5">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-parchment-50 text-burgundy-500 mt-0.5">
        <Hourglass className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          {label}
        </div>
        <div className="mt-0.5 font-display text-sm text-ink tabular-nums truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

// Working-toward strip — a quiet horizontal mention of the feasts the
// artist is open to working toward. Pulls from the same liturgical
// data the editor uses, so labels stay in sync.
function FeastWorkingTowardStrip({ slugs }: { slugs: string[] }) {
  const all = feastsForLiturgicalYear(new Date());
  const matched = all.filter((f) => slugs.includes(f.slug)).slice(0, 6);
  if (matched.length === 0) return null;
  return (
    <section className="container mt-12 max-w-3xl">
      <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
        Working toward
      </div>
      <ul className="flex flex-wrap gap-3">
        {matched.map((f) => (
          <li
            key={`${f.slug}-${f.date.toISOString()}`}
            className="inline-flex items-baseline gap-2 rounded-full border border-ink/15 bg-parchment-50 px-3 py-1.5 font-serif text-sm text-ink"
          >
            <span>{f.name}</span>
            <span className="text-ink-muted text-[11px] tabular-nums uppercase tracking-[0.18em]">
              {f.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
