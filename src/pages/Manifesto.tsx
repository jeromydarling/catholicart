import { Link } from "react-router-dom";
import { brand } from "../data/brand";
import { quotes, closingQuote } from "../data/quotes";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Quote } from "../components/Quote";

const ARTICLES: Array<{ heading: string; body: string }> = [
  {
    heading: "Beauty is the front line.",
    body: "The culture will not be saved by argument. It will be saved — if it is to be saved — by patient, beautiful things, made by people who know what they are doing. That is where we stake our claim. If you lose the war on beauty, you lose the culture.",
  },
  {
    heading: "The kitsch must end.",
    body: "For two generations the wealthiest Church in history has furnished its own parishes with mass-produced statues and its homes with souvenir-shop prints. We will not pretend this is fine. The seriousness of the faith must be visible in the things made for it. If we are not embarrassed by what we hang on our walls, we are not paying attention.",
  },
  {
    heading: "Put your money where your mouth is.",
    body: "Catholics talk about beauty constantly. Most do not pay for it. The art has gone elsewhere — to clients who still pay for it. If we want it back, we patronise. We commission. We send the cheque. We close the gap between what we say we believe and what we are willing to fund.",
  },
  {
    heading: "The artist is not a vendor.",
    body: "The artist is a craftsman, and craft is a vocation — a kind of prayer with materials. We will not speak of our artists as suppliers or content-providers. They make. They are paid as workers worthy of their wage. They are honoured.",
  },
  {
    heading: "Slow is sacred.",
    body: "The work is slow because the work is real. We will not promise turnaround windows the artist cannot keep, and we will not invent urgency to sell more. If you need it next week, you do not need it.",
  },
  {
    heading: "Wages, plainly stated.",
    body: "Each artist sets her tiers and her custom rules. You pay the price she asks. The guild takes a small, named fee — never hidden, never on a sliding pretext. Just commerce, plainly conducted.",
  },
  {
    heading: "The poor are not afterthoughts.",
    body: "Smaller works begin at modest prices, on purpose. In time, we will carry a fund so that parishes and persons without means can still receive a saint, an icon, a hymn — because beauty for the People of God is not a luxury good.",
  },
  {
    heading: "Patrons, not passive consumers.",
    body: "You are not buying merch. You are commissioning a real human being to make a real thing for the people of God. Be specific. Be patient. Be generous. Behave like the abbess, the king, the confraternity, the household of any of the last fifteen centuries.",
  },
  {
    heading: "Build, don’t argue.",
    body: "Beauty will save the world (Dostoevsky knew it; John Paul II repeated it). We do not say this lightly. The patient labour of beautiful things — made in workshops, paid for justly, given to communities that pray — is part of how God is putting the world to rights.",
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
          If we&rsquo;re serious.
        </h1>
        <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed">
          {brand.name} keeps to a small, written rule. We share it openly so
          that artists and patrons know what they are entering — and so that
          we are bound to it ourselves. The argument runs in nine lines.
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
