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
                <Date d={c.createdAt} />
              </Col>
              <Col label="Completed">
                {c.completedAt ? <Date d={c.completedAt} /> : <span>—</span>}
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
                          <>· <Date d={c.blessing.recordedAt} /></>
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
                Issued <Date d={c.certificate.issuedAt} />
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

function Date({ d }: { d: string }) {
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
