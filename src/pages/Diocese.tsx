import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { artists, isVerified } from "../data/artists";
import { artistsByDiocese, DIOCESE_COORDS } from "../data/artist-tags";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { initials } from "../lib/utils";

// /dioceses/:slug — a quiet landing page for a particular diocese.
// Lists the verified guild artists working within it; lights up when
// a bishop or chancery contact wants to link from their own site.
//
// The slug is a kebab-cased version of the diocese name (e.g.
// "diocese-of-pittsburgh"). We resolve to the canonical name by
// matching against DIOCESE_COORDS keys.

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_TO_DIOCESE: Record<string, string> = Object.fromEntries(
  Object.keys(DIOCESE_COORDS).map((d) => [slugify(d), d]),
);

export default function Diocese() {
  const { slug = "" } = useParams<{ slug: string }>();
  const diocese = SLUG_TO_DIOCESE[slug];
  const dioceseArtists = useMemo(
    () => (diocese ? artistsByDiocese(diocese) : []),
    [diocese],
  );

  if (!diocese) {
    return (
      <PageShell>
        <section className="container py-24 max-w-2xl text-center">
          <h1 className="font-display text-3xl text-ink">
            No diocese by that name.
          </h1>
          <p className="mt-3 font-serif text-ink-muted">
            The guild has not yet served a diocese with that slug. Browse
            the full directory to find an artist near you.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/browse">Browse the guild</Link>
          </Button>
          <Ornament className="my-10" />
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-ink-muted mb-3">
            Dioceses served so far
          </div>
          <ul className="text-left columns-2 gap-4 font-serif text-sm text-ink-soft">
            {Object.keys(DIOCESE_COORDS)
              .sort()
              .map((d) => (
                <li key={d} className="break-inside-avoid mb-2">
                  <Link
                    to={`/dioceses/${slugify(d)}`}
                    className="hover:text-burgundy-500"
                  >
                    {d}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </PageShell>
    );
  }

  const verified = dioceseArtists.filter(isVerified);

  return (
    <PageShell>
      <Seo
        title={`${diocese} — artists of the guild`}
        description={`Ars Sacra guild artists serving the ${diocese}. Iconography, painting, sculpture, glass, music, verse — commissioned directly from verified Catholic artists.`}
        path={`/dioceses/${slug}`}
      />
      <section className="container pt-12 sm:pt-16 max-w-4xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3 inline-flex items-center">
          <MapPin className="h-3 w-3 mr-1.5" /> Diocesan landing page
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          {diocese}
        </h1>
        <p className="mt-5 font-serif text-lg text-ink-muted leading-relaxed max-w-2xl">
          {dioceseArtists.length > 0 ? (
            <>
              <span className="text-ink font-medium">
                {dioceseArtists.length} {dioceseArtists.length === 1 ? "artist" : "artists"}
              </span>{" "}
              from the Ars Sacra guild serve this diocese.
              {verified.length > 0 && (
                <>
                  {" "}
                  <span className="text-olive-600">
                    {verified.length} {verified.length === 1 ? "is" : "are"}{" "}
                    pastor-endorsed
                  </span>
                  {" "}— their parish priest, religious superior, or
                  chancery has formally vouchsafed their work.
                </>
              )}
            </>
          ) : (
            <>
              No guild artists are yet at work in this diocese. If you are a
              Catholic artist here, or a pastor who knows one, we'd love to
              hear from you.
            </>
          )}
        </p>
        <Ornament className="my-10" />

        {dioceseArtists.length > 0 && (
          <ul className="space-y-4">
            {dioceseArtists.map((a) => {
              const cat = categoryBySlug(a.categories[0]);
              return (
                <li
                  key={a.slug}
                  className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <Link
                      to={`/artists/${a.slug}`}
                      className="h-14 w-14 shrink-0 rounded-full grid place-items-center text-parchment-50 font-display text-lg"
                      style={{
                        background: `linear-gradient(135deg, ${a.portraitFrom}, ${a.portraitTo})`,
                      }}
                    >
                      {initials(a.name)}
                    </Link>
                    <div className="grow min-w-0">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <div className="font-display text-xl text-ink leading-tight">
                          <Link
                            to={`/artists/${a.slug}`}
                            className="hover:text-burgundy-500"
                          >
                            {a.honorific ? `${a.honorific} ` : ""}
                            {a.name}
                          </Link>
                        </div>
                        {isVerified(a) && (
                          <Badge variant="olive" className="inline-flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Endorsed
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                        {cat?.name} · {a.city}
                      </div>
                      {a.vocationStatement && (
                        <p
                          className="mt-3 font-serif italic text-base text-ink-soft leading-relaxed max-w-2xl"
                          style={{ textWrap: "balance" } as React.CSSProperties}
                        >
                          “{a.vocationStatement}”
                        </p>
                      )}
                      <div className="mt-3">
                        <Button
                          asChild
                          variant="link"
                          className="px-0 text-burgundy-500 hover:text-burgundy-600"
                        >
                          <Link to={`/artists/${a.slug}`}>
                            See their portfolio
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Ornament className="my-12" />
        <div className="rounded-md border border-ink/10 bg-parchment-100 p-5 sm:p-6 max-w-3xl mx-auto text-center">
          <div className="font-display text-lg text-ink">
            Are you a chancery, pastor, or diocesan vocations director?
          </div>
          <p className="mt-2 font-serif text-sm text-ink-soft leading-relaxed">
            We'd like to link to you. If a Catholic artist in your community
            wants to apply to the guild, we ask only that you affirm — by
            email, one click — that they are a parishioner in good standing.
            No accounts, no contracts.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/partnerships">Talk to the guild</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

// Used by other modules importing the canonical slug map.
export { slugify as slugifyDiocese, SLUG_TO_DIOCESE };
// Reference imports kept live
artists;
