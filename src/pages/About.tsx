import { Link } from "react-router-dom";
import { brand } from "../data/brand";
import { quotes } from "../data/quotes";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Quote } from "../components/Quote";

const CST_PRINCIPLES = [
  {
    name: "Dignity of the human person",
    body: "Each artist and each commissioner is made in the image of God. The marketplace is ordered to that dignity, not against it.",
  },
  {
    name: "Dignity of work",
    body: "Work is a participation in God's own creative activity (Laborem Exercens, §25). Our artists are paid as workers worthy of their wage, not as content-providers competing in a race to the bottom.",
  },
  {
    name: "Solidarity",
    body: "Commissioners and artists belong to one body. The conversation between them is unhurried, attentive, and human.",
  },
  {
    name: "Subsidiarity",
    body: "Each artist runs their own studio. We connect, vouch, and step out of the way. Decisions about pricing and scope rest with the artist.",
  },
  {
    name: "Common good",
    body: "Beautiful art for chapel and home blesses the whole community — those who pray before it, those who pass it, and those who inherit it.",
  },
  {
    name: "Option for the poor",
    body: "Smaller works begin at modest prices. We carry a fund, in time, so a parish without means can still receive an icon, a hymn, a saint.",
  },
  {
    name: "Care for creation",
    body: "Linen, wood, stone, glass, ink, breath. Our artists make from God's own creation; the materials are honoured and the work is meant to last.",
  },
];

const PROMISES = [
  {
    title: "Just wages, plainly stated",
    body: "Each artist sets their tiers and their custom-quote rules. Commissioners pay the price the artist asks. The platform takes a small, named fee — never hidden.",
  },
  {
    title: "Slow conversation",
    body: "We do not rush replies. Each artist commits only to a turnaround they can keep, in writing, before the work begins.",
  },
  {
    title: "Vouched-for artists",
    body: "Each artist is vouched for by a master, a parish, or a body of prior commissions. We accept artists slowly because we want each entry to mean something.",
  },
  {
    title: "No hidden takedowns",
    body: "Artists own their work. They may leave the guild and take their portfolio with them at any time.",
  },
];

export default function About() {
  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-4xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          The mission
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          A guild for Catholic artists.
          <span className="block italic text-burgundy-500 mt-2">
            Beauty for the People of God.
          </span>
        </h1>
        <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed max-w-3xl">
          {brand.name} exists because the faithful still need beautiful
          things, and Catholic artists still need to be paid honestly to make
          them. We are a connector, a register, and a slow conversation
          between the two.
        </p>
        <Ornament className="my-10" />
      </section>

      <section className="container max-w-3xl">
        <Quote quote={quotes[1]} size="md" />
      </section>

      <section id="how-it-works" className="container mt-20 sm:mt-28 max-w-4xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          The story
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-ink leading-[1.1]">
          Why a guild, and why now.
        </h2>
        <div className="mt-8 space-y-6">
          <p className="font-serif text-lg text-ink-soft leading-relaxed drop-cap">
            In 1999 John Paul II addressed a Letter to Artists — to all who
            are passionately dedicated to the search for new <em>epiphanies</em> of
            beauty. The Church, he wrote, has need of art. So does the world.
            And artists, in turn, have need of communities that will commission
            them to make.
          </p>
          <p className="font-serif text-lg text-ink-soft leading-relaxed">
            For most of our history, that work was done by guilds. A young
            sculptor was apprenticed; a cathedral chapter commissioned an
            altarpiece; a parish paid a composer for a Mass setting; a family
            asked the village painter for a patron-saint icon. The
            conversation was slow, particular, and embedded in the life of
            the community.
          </p>
          <p className="font-serif text-lg text-ink-soft leading-relaxed">
            {brand.name} is a small, modern attempt to do something of the
            same — for the faithful who want beautiful things made for chapel
            and home, and for the artists whose vocation is to make them.
          </p>
        </div>
      </section>

      <section id="cst" className="container mt-20 sm:mt-28 max-w-5xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Our footing
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-ink leading-[1.1]">
          The marketplace, ordered by Catholic Social Teaching.
        </h2>
        <p className="mt-5 font-serif text-lg text-ink-muted max-w-3xl">
          Seven principles drawn from the social tradition of the Church.
          They are not slogans; they are commitments we keep with our
          decisions about wages, scope, and time.
        </p>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CST_PRINCIPLES.map((p, i) => (
            <div
              key={p.name}
              className="rounded-md border border-ink/10 bg-parchment-50 p-5 sm:p-6 shadow-card"
            >
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
                Principle {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-2 font-display text-xl text-ink">{p.name}</h3>
              <p className="mt-2 font-serif text-base text-ink-soft leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mt-20 sm:mt-28 max-w-4xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          What we promise
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-ink leading-[1.1]">
          The promises we keep.
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 gap-6 sm:gap-8">
          {PROMISES.map((p, i) => (
            <div key={p.title} className="flex gap-4">
              <span className="font-display text-3xl text-gold-500 leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-xl text-ink leading-tight">
                  {p.title}
                </h3>
                <p className="mt-2 font-serif text-base text-ink-soft leading-relaxed">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mt-20 sm:mt-28 max-w-3xl">
        <Quote quote={quotes[6]} size="md" />
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/browse">Browse the guild</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/manifesto">Read the manifesto</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
