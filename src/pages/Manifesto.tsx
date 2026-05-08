import { Link } from "react-router-dom";
import { brand } from "../data/brand";
import { quotes, closingQuote } from "../data/quotes";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Quote } from "../components/Quote";

const ARTICLES: Array<{ heading: string; body: string }> = [
  {
    heading: "The artist is not a vendor.",
    body: "The artist is a craftsman, and craft is a vocation — a kind of prayer with materials. We will not speak of our artists as suppliers, sellers, or providers. They make. They are paid. They are honoured.",
  },
  {
    heading: "Beauty is the visible form of the good.",
    body: "We will not pretend beauty is decoration. Beauty is the visible form of the good and a glimmer of the Spirit of God. A good icon, a good hymn, a good play makes the kingdom a little more present in the world.",
  },
  {
    heading: "Slow is sacred.",
    body: "The work is slow because the work is real. We will not promise turnaround windows the artist cannot keep, and we will not invent urgency to sell more.",
  },
  {
    heading: "Wages, plainly stated.",
    body: "Each artist sets her tiers and her custom rules. Commissioners pay the asking price. The guild takes a small, named fee — never hidden, never on a sliding pretext.",
  },
  {
    heading: "Catholic, not kitsch.",
    body: "We are catholic in the old sense — universal, formed, plural. We make for chapel, parish, and home; in many tongues; with the discipline of the canon and the freedom of the genuine.",
  },
  {
    heading: "The poor are not afterthoughts.",
    body: "Smaller works begin at modest prices. In time, we will carry a fund so that parishes and persons without means can still receive a saint, an icon, a hymn.",
  },
  {
    heading: "We are not the Church.",
    body: "We are a guild — a body of artists and patrons in conversation. We do not stand in for the bishop, the parish, or the magisterium. We work in their shadow and at their service.",
  },
  {
    heading: "Beauty will save the world.",
    body: "We do not say this lightly. We mean: the patient labour of beautiful things — made in workshops, paid for justly, given to communities that pray — is part of how God is putting the world to rights.",
  },
];

export default function Manifesto() {
  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          The manifesto
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          A rule of life, for a guild.
        </h1>
        <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed">
          {brand.name} keeps to a small, written rule. We share it openly so
          that artists and commissioners know what they are entering, and
          what we will and will not do.
        </p>
        <Ornament className="my-10" />
      </section>

      <section className="container max-w-3xl">
        <Quote quote={quotes[5]} size="md" />
      </section>

      <section className="container mt-16 sm:mt-24 max-w-3xl">
        <ol className="space-y-12">
          {ARTICLES.map((a, i) => (
            <li key={a.heading} className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-2 font-display text-5xl text-gold-500 leading-none">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="sm:col-span-10">
                <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
                  {a.heading}
                </h2>
                <p className="mt-3 font-serif text-lg text-ink-soft leading-relaxed">
                  {a.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="container mt-20 sm:mt-28 max-w-3xl">
        <Quote quote={closingQuote} size="lg" />
        <p className="mt-8 text-center font-serif italic text-ink-muted max-w-md mx-auto">
          From the closing of John Paul II's Letter to Artists, 4 April 1999.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/signup/artist">Apply to the guild</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/browse">Browse the artists</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
