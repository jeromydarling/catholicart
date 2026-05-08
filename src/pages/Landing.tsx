import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Feather, HandHeart, MessagesSquare } from "lucide-react";
import { brand } from "../data/brand";
import { categories } from "../data/categories";
import { artists } from "../data/artists";
import { heroQuote, quotes } from "../data/quotes";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Quote } from "../components/Quote";
import { CategoryTile } from "../components/CategoryTile";
import { ArtistCard } from "../components/ArtistCard";

const HOW = [
  {
    icon: Feather,
    title: "Browse the guild",
    body: "Read each artist's vocation, study their portfolios, and find the hand suited to your commission.",
  },
  {
    icon: MessagesSquare,
    title: "Describe what you long for",
    body: "Tell the artist about the saint, the season, the room, the recipient. Be plain. They are listening.",
  },
  {
    icon: HandHeart,
    title: "Receive a sacred work",
    body: "Pricing and timeline are agreed before the work begins. The artist is paid justly and the work is yours.",
  },
];

export default function Landing() {
  const featured = artists.slice(0, 4);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at 80% 0%, rgba(168,137,63,0.10), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(122,31,44,0.08), transparent 55%)",
          }}
        />
        <div className="container pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-5">
                {brand.tagline}
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.25rem] leading-[1.02] tracking-tight text-ink">
                Commission the
                <span className="block italic text-burgundy-500">beautiful.</span>
              </h1>
              <p className="mt-6 max-w-xl font-serif text-lg sm:text-xl text-ink-soft leading-relaxed">
                {brand.name} is a guild of Catholic artists — iconographers,
                sculptors, composers, poets, dramatists — who take commissions
                from the faithful and make work fit for chapel, parish, and
                home.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/browse">
                    Browse artists <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/signup/artist">Apply to the guild</Link>
                </Button>
              </div>

              <div className="mt-10 sm:mt-14 max-w-md">
                <Ornament className="mb-4" />
                <p
                  className="font-display italic text-base sm:text-lg text-ink-soft leading-snug"
                  style={{ textWrap: "balance" } as React.CSSProperties}
                >
                  “{heroQuote.text}”
                </p>
                <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                  — John Paul II · Letter to Artists, 1999
                </p>
              </div>
            </motion.div>

            {/* Hero plate */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <HeroPlate />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container pt-8 sm:pt-12">
        <SectionHeading
          eyebrow="The crafts"
          title="Eight crafts, one tradition"
          intro="From the gold-leaf of Byzantium to the polyphony of the Roman rite, the Catholic imagination has worked in many materials and many tongues. Find the one suited to your commission."
        />
        <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((c, i) => (
            <CategoryTile key={c.slug} category={c} index={i} />
          ))}
        </div>
      </section>

      {/* Featured artists */}
      <section className="container pt-20 sm:pt-28">
        <SectionHeading
          eyebrow="The guild"
          title="A few of our artists"
          intro="Each member of the guild is vouched for by a parish, a master, or a prior commission. They are paid justly; their craft is their vocation."
        />
        <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((a, i) => (
            <ArtistCard key={a.slug} artist={a} index={i} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/browse">
              See all {artists.length} artists{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mt-20 sm:mt-28 border-y border-ink/10 bg-parchment-100/50"
      >
        <div className="container py-16 sm:py-24">
          <SectionHeading
            eyebrow="How it works"
            title="A commission, made plain"
          />
          <div className="mt-10 sm:mt-14 grid md:grid-cols-3 gap-6 sm:gap-10">
            {HOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                  className="relative"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-burgundy-500 text-parchment-50">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-600">
                      Step {i + 1}
                    </div>
                  </div>
                  <h3 className="mt-5 font-display text-2xl text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 font-serif text-base text-ink-soft leading-relaxed">
                    {step.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Manifesto excerpt */}
      <section className="container pt-20 sm:pt-28">
        <div className="max-w-3xl mx-auto">
          <Quote quote={quotes[3]} size="lg" />
          <div className="mt-10 sm:mt-14 grid gap-6 sm:gap-8 sm:grid-cols-2">
            <Tenet
              title="Just wages, plainly stated"
              body="No race-to-the-bottom bidding. Each artist sets her tiers and her custom-quote rules. The faithful pay the price the artist asks."
            />
            <Tenet
              title="Beauty is not a luxury"
              body="Beauty is the visible form of the good. A good icon, a good hymn, a good play makes the kingdom of heaven a little nearer."
            />
            <Tenet
              title="A vocation, not a hustle"
              body="Our artists keep the rule of their craft. The work is slow because it is a kind of prayer."
            />
            <Tenet
              title="Catholic, not kitsch"
              body="We are catholic in the old sense — universal, formed, plural. We make for chapel and home, parish and pilgrimage, in many tongues."
            />
          </div>
          <div className="mt-10 flex justify-center">
            <Button asChild variant="link" size="lg">
              <Link to="/manifesto">Read the manifesto</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pt-20 sm:pt-28 pb-4">
        <div className="rounded-md border border-ink/10 bg-ink text-parchment-50 px-6 sm:px-12 py-12 sm:py-16 shadow-plate relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-12 items-end">
            <div className="lg:col-span-8">
              <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-300 mb-4">
                Begin a commission
              </div>
              <h2 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
                Tell an artist what you long for.
              </h2>
              <p className="mt-4 font-serif text-base sm:text-lg text-parchment-200/90 max-w-xl">
                A patron saint for a child. A motet for a wedding. An altar
                piece for a parish. A poem for a requiem. The work is
                hand-made, and so is the conversation.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch">
              <Button asChild size="lg" variant="gold">
                <Link to="/browse">Browse artists</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-parchment-200/40 text-parchment-50 hover:bg-parchment-50/10 hover:border-parchment-200/60"
              >
                <Link to="/signup/artist">Apply as an artist</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
        {eyebrow}
      </div>
      <h2 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05] text-ink">
        {title}
      </h2>
      {intro && (
        <p className="mt-5 font-serif text-base sm:text-lg text-ink-soft leading-relaxed">
          {intro}
        </p>
      )}
    </div>
  );
}

function Tenet({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-gold-500">✦</span>
        <h3 className="font-display text-xl text-ink">{title}</h3>
      </div>
      <p className="mt-2 font-serif text-base text-ink-soft leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function HeroPlate() {
  return (
    <div className="relative mx-auto max-w-md lg:max-w-none">
      <div
        className="aspect-[3/4] rounded-md shadow-plate border border-ink/10 overflow-hidden relative"
        style={{
          background:
            "linear-gradient(160deg, #5e1623 0%, #1c160e 60%, #876b2c 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          aria-hidden
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
          }}
        />
        <div className="absolute inset-4 sm:inset-5 rounded border border-parchment-50/15" />
        <div className="absolute inset-0 grid place-items-center text-parchment-50">
          <svg
            viewBox="0 0 200 260"
            className="w-3/5 h-3/5 sm:w-2/3 sm:h-2/3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <circle cx="100" cy="80" r="40" opacity="0.7" />
            <circle cx="100" cy="80" r="54" opacity="0.4" />
            <path d="M100 124 C70 140 60 200 70 240 L130 240 C140 200 130 140 100 124 Z" opacity="0.85" />
            <path d="M100 80 v-60 M70 30 h60" opacity="0.6" />
          </svg>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-parchment-50">
          <div
            className="font-display italic text-xl sm:text-2xl leading-tight tracking-tight"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Theotokos of the Sign
          </div>
          <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] opacity-80">
            Egg tempera, gold leaf · 2024
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -right-5 sm:-bottom-7 sm:-right-7 hidden sm:block">
        <div
          className="aspect-square w-32 rounded-md shadow-card border border-ink/10 overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, #1d3a6b 0%, #28477a 60%, #c9a961 100%)",
          }}
        >
          <div className="h-full w-full grid place-items-center text-parchment-50">
            <span className="font-display italic text-sm leading-tight text-center px-3">
              Tree of Jesse
              <span className="block font-sans not-italic uppercase text-[9px] tracking-[0.22em] mt-1 opacity-80">
                Stained glass
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
