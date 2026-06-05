import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Feather, HandHeart, MessagesSquare, PlayCircle, Sparkles } from "lucide-react";
import { brand } from "../data/brand";
import { categories } from "../data/categories";
import { artists } from "../data/artists";
import { flags } from "../data/flags";
import { heroQuote, quotes } from "../data/quotes";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Quote } from "../components/Quote";
import { CategoryTile } from "../components/CategoryTile";
import { ArtistCard } from "../components/ArtistCard";
import { HeroVideo } from "../components/HeroVideo";
import { LiturgicalSeasonBanner } from "../components/LiturgicalSeason";
import { Seo } from "../components/Seo";
import { BrowserFrame } from "../components/marketing/BrowserFrame";
import { MiniVocation } from "../components/marketing/mini/MiniVocation";
import { MiniWipFeed } from "../components/marketing/mini/MiniWipFeed";
import { MiniCertificate } from "../components/marketing/mini/MiniCertificate";

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
      <Seo
        title="Locavit · Commission Beauty"
        description="Commission Catholic sacred art from a guild of pastor-endorsed artists. The artist receives 100% of their quote; a 2% guild tithe settles at the very end. Iconography, painting, sculpture, glass, music, verse."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Locavit",
          url: "https://catholicart.jer-f84.workers.dev",
          slogan: "Ad maiorem Dei gloriam, per pulchritudinem.",
          description:
            "A guild and marketplace for commissioning Catholic sacred art from pastor-endorsed artists.",
        }}
      />
      {/* Hero — full-bleed cinematic, makes the commission thesis visible */}
      <section className="relative h-[calc(100svh-4rem)] sm:h-[calc(100svh-5rem)] min-h-[600px] max-h-[880px] overflow-hidden">
        <HeroVideo />

        <div className="relative h-full container flex flex-col">
          <div className="grow" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-xl lg:max-w-2xl pb-52 sm:pb-44 lg:pb-32 pt-16 sm:pt-20"
          >
            <div className="font-sans text-[11px] uppercase tracking-[0.32em] text-gold-300 mb-4 sm:mb-5">
              {brand.tagline}
            </div>
            <h1
              className="font-display text-[2.5rem] sm:text-6xl md:text-7xl lg:text-[5rem] leading-[1.04] tracking-tight text-parchment-50 drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)]"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              A covenant between
              <span className="block italic text-gold-300 mt-1">
                artist and patron.
              </span>
            </h1>
            <p className="mt-4 sm:mt-5 max-w-md lg:max-w-lg font-serif text-[15px] sm:text-lg lg:text-xl text-parchment-100 leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
              Write to a pastor-endorsed Catholic artist about what you want
              made; they answer with a vision and a quote. The artist keeps
              every cent. A 2% guild tithe settles at the very end — just
              enough to keep the lights on.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gold">
                <Link to="/browse">
                  Commission an artist{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-parchment-50/10 border-parchment-50/40 text-parchment-50 hover:bg-parchment-50/20 hover:border-parchment-50/60 backdrop-blur-sm"
              >
                <Link to="/signup/artist">Apply as an artist</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Thesis epigraph — bridge between video hero and the marketplace */}
      <section className="container pt-16 sm:pt-24 pb-4 max-w-3xl">
        <Ornament className="mb-7" />
        <p
          className="font-display italic text-2xl sm:text-3xl md:text-4xl text-ink leading-snug text-center"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          “{heroQuote.text}”
        </p>
        <p className="mt-5 text-center font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted">
          — John Paul II · Letter to Artists, 1999
        </p>
      </section>

      {/* The argument */}
      <section className="container pt-20 sm:pt-28 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          The argument
        </div>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.02] text-ink">
          If we&rsquo;re serious.
        </h2>
        <div className="mt-8 space-y-6">
          <p className="font-serif text-lg sm:text-xl text-ink leading-relaxed drop-cap">
            For fifteen hundred years the Church didn&rsquo;t argue the world
            into the kingdom. She built it — through stone and tempera, through
            chant and stained glass, through patient commissions made by
            abbesses and kings, confraternities and ordinary households. The
            faithful taught humanity to see.
          </p>
          <p className="font-serif text-lg sm:text-xl text-ink-soft leading-relaxed">
            Then we stopped commissioning. The wealthiest Catholics in history
            now furnish their parishes with mass-produced statues and their
            homes with souvenir-shop prints. The art has gone elsewhere — to
            patrons who still pay for it.
          </p>
          <p className="font-serif text-lg sm:text-xl text-ink leading-relaxed">
            <strong className="font-medium">
              If we&rsquo;re serious about changing the culture, it starts
              here.
            </strong>{" "}
            Take beauty seriously again. Commission. Put your money where your
            mouth is.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/browse">
              Commission an artist <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="link" size="lg">
            <Link to="/manifesto">Read the manifesto</Link>
          </Button>
        </div>
      </section>

      {/* Liturgical season banner — orient the patron in the year */}
      <div className="mt-20 sm:mt-28">
        <LiturgicalSeasonBanner />
      </div>

      {/* Categories */}
      <section className="container pt-20 sm:pt-28">
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

      {/* Featured artists — surfaces only when the directory is populated. */}
      {flags.showArtistDirectory && featured.length > 0 && (
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
      )}

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

      {/* See it working — chromeless browser frames showing the actual product */}
      <section className="container pt-20 sm:pt-28">
        <div className="max-w-3xl mb-12">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
            See it working
          </div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05] text-ink">
            Three rooms of the same house.
          </h2>
          <p className="mt-5 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed">
            The artist's vocation site, the studio reel mid-commission,
            and the certificate that ships with the work. Three rooms
            you can walk into right now.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <FramedPreview
            url="locavit.com/sr-maria-chrysostom"
            label="The artist's page"
            delay={0}
          >
            <MiniVocation />
          </FramedPreview>
          <FramedPreview
            url="locavit.com/workspace/joseph-panel"
            label="The studio reel"
            delay={0.1}
          >
            <MiniWipFeed />
          </FramedPreview>
          <FramedPreview
            url="locavit.com/certificate/joseph-panel"
            label="The provenance certificate"
            delay={0.2}
          >
            <MiniCertificate />
          </FramedPreview>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/demo">
              <PlayCircle className="mr-2 h-4 w-4" />
              Walk through a commission
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/features">
              <Sparkles className="mr-2 h-4 w-4" />
              Every feature, plainly
            </Link>
          </Button>
        </div>
      </section>

      {/* Manifesto excerpt */}
      <section className="container pt-20 sm:pt-28">
        <div className="max-w-3xl mx-auto">
          <Quote quote={quotes[3]} size="lg" />
          <div className="mt-10 sm:mt-14 grid gap-6 sm:gap-8 sm:grid-cols-2">
            <Tenet
              title="Beauty is the front line"
              body="The culture won&rsquo;t be saved by argument. It will be saved — if it is to be saved — by patient, beautiful things, made by people who know what they are doing."
            />
            <Tenet
              title="Pay the artist"
              body="No race-to-the-bottom bidding. Each artist sets her tiers and her own custom-quote rules. You pay the price she asks. Plainly stated."
            />
            <Tenet
              title="Catholic, not kitsch"
              body="The seriousness of the faith must be visible in the things we make for it. Mass-produced statues from a catalog do not count."
            />
            <Tenet
              title="Patrons, not consumers"
              body="You are not buying merch. You are commissioning a real human being to make a real thing for the people of God. Be specific. Be patient. Be generous."
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
                Stop buying kitsch.
              </div>
              <h2 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
                Commission the beautiful.
              </h2>
              <p className="mt-4 font-serif text-base sm:text-lg text-parchment-200/90 max-w-xl">
                A patron saint for a child. A motet for a wedding. An
                altarpiece for a parish. A poem for a requiem. Hand-made,
                hand-paid. The least you can do is take it as seriously as
                the artist does.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch">
              <Button asChild size="lg" variant="gold">
                <Link to="/browse">Commission an artist</Link>
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

function FramedPreview({
  url,
  label,
  delay,
  children,
}: {
  url: string;
  label: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2 px-1">
        {label}
      </div>
      <BrowserFrame url={url}>{children}</BrowserFrame>
    </motion.div>
  );
}

