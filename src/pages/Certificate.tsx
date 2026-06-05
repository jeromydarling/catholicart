import { Link, useParams } from "react-router-dom";
import { Printer, ShieldCheck, Stamp } from "lucide-react";
import { artistBySlug } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { brand } from "../data/brand";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { formatPrice } from "../lib/utils";
import { Seo } from "../components/Seo";

// Provenance certificate. Print-friendly. Records who made the work, who
// commissioned it, who endorsed the artist, who blessed the finished
// piece. Hand-pressed feel; the page is the artifact.
export default function Certificate() {
  const { id = "" } = useParams<{ id: string }>();
  const { getCommission } = useStore();
  const c = getCommission(id);

  if (!c || !c.certificate) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl">No certificate yet</h1>
          <p className="mt-3 font-serif text-ink-muted">
            A certificate is issued when the patron releases the final
            payment. This commission isn't there yet.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/ledger">Back to the Ledger</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const artist = artistBySlug(c.artistSlug);
  const cat = categoryBySlug(c.category);

  return (
    <PageShell>
      <Seo
        title={`Certificate · ${c.certificate.title} · ${artist?.name ?? "Ars Sacra"}`}
        description={`Provenance certificate for ${c.certificate.title}, by ${artist?.name ?? "an Ars Sacra artist"}. Serial ${c.certificate.serial}. Recorded in The Ledger.`}
        path={`/certificate/${c.id}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: c.certificate.title,
          dateCreated: c.completedAt,
          identifier: c.certificate.serial,
          creator: artist
            ? {
                "@type": "Person",
                name: artist.name,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: artist.city,
                  addressCountry: artist.region,
                },
              }
            : undefined,
          publisher: { "@type": "Organization", name: "Ars Sacra" },
          genre: cat?.name,
        }}
      />
      {/* Action toolbar — hidden on print */}
      <section className="container pt-8 sm:pt-12 print:hidden">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-3">
          <Link to="/ledger" className="hover:text-burgundy-500">
            The Ledger
          </Link>{" "}
          ›{" "}
          <Link to={`/workspace/${c.id}`} className="hover:text-burgundy-500">
            Commission
          </Link>{" "}
          › Certificate
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-ink">
              Certificate of authenticity
            </h1>
            <p className="mt-1 font-serif text-sm text-ink-muted">
              Print, frame, archive. The certificate carries a unique serial
              and is recorded in The Ledger.
            </p>
          </div>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </section>

      {/* The certificate itself — print-styled */}
      <section className="container my-10 sm:my-14 max-w-[8.5in] print:my-0 print:max-w-none print:px-0">
        <article
          className="relative bg-parchment-50 border-2 border-ink/15 rounded-md shadow-plate print:shadow-none print:rounded-none p-6 sm:p-12 lg:p-16 sm:[aspect-ratio:8.5/11] sm:min-h-[10in] print:[aspect-ratio:8.5/11] print:min-h-[10in]"
        >
          {/* Ornamental gold frame inset */}
          <div
            className="absolute inset-3 sm:inset-5 border border-gold-500/40 pointer-events-none"
            aria-hidden
          />

          {/* Watermark */}
          <div
            className="absolute inset-0 grid place-items-center pointer-events-none opacity-[0.04]"
            aria-hidden
          >
            <svg viewBox="0 0 200 200" className="h-3/4 w-3/4">
              <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M100 30 v140 M30 100 h140" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
          </div>

          <div className="relative h-full flex flex-col">
            {/* Header */}
            <header className="text-center">
              <div className="font-sans text-[11px] uppercase tracking-[0.32em] text-gold-600">
                {brand.name}
              </div>
              <Ornament className="my-3" />
              <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-ink">
                Certificate of Authenticity & Provenance
              </h2>
              <p className="mt-2 font-serif italic text-sm text-ink-muted">
                {brand.motto}
              </p>
            </header>

            {/* Title block */}
            <div className="mt-10 sm:mt-12 text-center">
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                The work
              </div>
              <h3
                className="mt-3 font-display italic text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                {c.certificate.title}
              </h3>
              {cat && (
                <p className="mt-3 font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
                  {cat.name} · {c.setting}
                </p>
              )}
            </div>

            {/* Two-column metadata */}
            <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 gap-6 sm:gap-10 text-sm">
              <Col label="By the hand of">
                <span className="font-display text-lg text-ink">
                  {artist?.honorific ? `${artist.honorific} ` : ""}
                  {artist?.name}
                </span>
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mt-1">
                  {artist?.city} · {artist?.region}
                </div>
              </Col>
              <Col label="Commissioned by">
                <span className="font-display text-lg text-ink">
                  {c.patronName}
                </span>
                {c.parishOrChapel && (
                  <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mt-1">
                    For {c.parishOrChapel}
                  </div>
                )}
              </Col>
              <Col label="Begun">
                <DateLine d={c.createdAt} />
              </Col>
              <Col label="Completed">
                {c.completedAt ? <DateLine d={c.completedAt} /> : <span>—</span>}
              </Col>
              {c.feastDeadline && (
                <Col label="Made for">
                  <span className="font-display text-base text-ink">
                    {c.feastDeadline.name}
                  </span>
                </Col>
              )}
              {c.artistTotalUsd != null && (
                <Col label="Artist's price">
                  <span className="font-display text-base text-ink tabular-nums">
                    {formatPrice(c.artistTotalUsd)}
                  </span>
                </Col>
              )}
            </div>

            {/* Artist's note */}
            {c.artistQuoteNote && (
              <div className="mt-10 pt-6 border-t border-ink/10">
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
                  The artist's hand
                </div>
                <p className="font-serif italic text-base text-ink-soft leading-relaxed">
                  {c.artistQuoteNote}
                </p>
              </div>
            )}

            {/* Provenance chain — the work's life on one page. */}
            <ProvenanceChain commission={c} />

            {/* Endorsement & blessing */}
            <div className="mt-auto pt-10 grid sm:grid-cols-2 gap-6 sm:gap-10 border-t border-ink/10">
              {artist?.verification?.verifierName ? (
                <Col label="Endorsed">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-olive-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-display text-base text-ink leading-tight">
                        {artist.verification.verifierName}
                      </div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mt-0.5">
                        {artist.verification.parishOrCommunity}
                      </div>
                    </div>
                  </div>
                </Col>
              ) : (
                <Col label="Endorsed">
                  <span className="font-serif italic text-ink-muted">—</span>
                </Col>
              )}

              {c.blessing ? (
                <Col label="Blessed">
                  <div className="flex items-start gap-2">
                    <Stamp className="h-4 w-4 text-burgundy-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-display text-base text-ink leading-tight">
                        {c.blessing.recordedBy}
                      </div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mt-0.5">
                        {c.blessing.parishOrChapel ?? ""}{" "}
                        {c.blessing.recordedAt && (
                          <>· <DateLine d={c.blessing.recordedAt} /></>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              ) : (
                <Col label="Blessed">
                  <span className="font-serif italic text-ink-muted">
                    Awaiting record
                  </span>
                </Col>
              )}
            </div>

            {/* Footer */}
            <footer className="mt-8 pt-5 border-t border-ink/10 flex items-baseline justify-between gap-3 flex-wrap">
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted tabular-nums">
                Serial · {c.certificate.serial}
              </div>
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted tabular-nums">
                Issued <DateLine d={c.certificate.issuedAt} />
              </div>
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-burgundy-500">
                Recorded in <Link to="/ledger" className="underline">The Ledger</Link>
              </div>
            </footer>
          </div>
        </article>
      </section>

      <style>{`
        @media print {
          body { background: white !important; }
          @page { size: letter; margin: 0.5in; }
          header, footer, nav, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </PageShell>
  );
}

// Pulls the patron's first letter, the artist's first reply (their
// vision), and the WIP cycle out of the commission's messages/wip
// streams, and renders them as a quiet provenance chain — the work's
// life on one page. The patron's first message is anonymized to
// initials so the certificate can be shared without exposing the
// patron's full name on every page.
function ProvenanceChain({
  commission,
}: {
  commission: ReturnType<typeof useStore>["commissions"][number];
}) {
  const c = commission;
  const patronLetter = c.messages.find((m) => m.authorRole === "patron");
  const vision = c.messages.find(
    (m, i) => m.authorRole === "artist" && (i === 0 || c.messages[0].authorRole !== "artist"),
  );
  const wip = [...(c.wip ?? [])].sort(
    (a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime(),
  );
  if (!patronLetter && !vision && wip.length === 0) return null;

  const anon = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0] + ".";
    const last = parts[parts.length - 1] ?? "";
    return `${parts[0][0]}. ${last[0]}.`;
  };

  return (
    <div className="mt-10 pt-6 border-t border-ink/10">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-4">
        Provenance — the work's life
      </div>

      {patronLetter && (
        <section className="mb-7">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-2">
            The patron's letter · from {anon(c.patronName)}
          </div>
          <blockquote className="border-l-2 border-burgundy-500/40 pl-4 font-serif text-[15px] text-ink-soft italic leading-relaxed whitespace-pre-line">
            {patronLetter.body}
          </blockquote>
        </section>
      )}

      {vision && (
        <section className="mb-7">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-2">
            The artist's vision
          </div>
          <blockquote className="border-l-2 border-gold-500/60 pl-4 font-serif text-[15px] text-ink leading-relaxed whitespace-pre-line">
            {vision.body}
          </blockquote>
        </section>
      )}

      {wip.length > 0 && (
        <section>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-3">
            From the studio · {wip.length} {wip.length === 1 ? "update" : "updates"}
          </div>
          <ol className="space-y-4">
            {wip.map((w) => (
              <li key={w.id} className="flex gap-3">
                <div
                  className="h-14 w-14 shrink-0 rounded-sm ring-1 ring-ink/10"
                  style={{
                    background: `linear-gradient(135deg, ${w.paletteFrom}, ${w.paletteTo})`,
                  }}
                  aria-hidden
                />
                <div className="grow">
                  <div className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                    {new Date(w.postedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <p className="mt-0.5 font-serif text-[15px] text-ink leading-snug">
                    {w.caption}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Col({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-1.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function DateLine({ d }: { d: string }) {
  return (
    <span className="font-sans text-sm tabular-nums">
      {new window.Date(d).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}
    </span>
  );
}
