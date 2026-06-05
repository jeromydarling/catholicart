import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  HandHeart,
  Hourglass,
  Library as LibraryIcon,
  Link2,
  Mail,
  Mailbox,
  Map as MapIcon,
  Moon,
  Palette,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Stamp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { BrowserFrame } from "../components/marketing/BrowserFrame";
import { MiniVocation } from "../components/marketing/mini/MiniVocation";
import { MiniLetterFlow } from "../components/marketing/mini/MiniLetterFlow";
import { MiniWipFeed } from "../components/marketing/mini/MiniWipFeed";
import { MiniCertificate } from "../components/marketing/mini/MiniCertificate";
import { MiniEndorsement } from "../components/marketing/mini/MiniEndorsement";
import { MiniLibrary } from "../components/marketing/mini/MiniLibrary";
import { MiniEarnings } from "../components/marketing/mini/MiniEarnings";
import { MiniLedger } from "../components/marketing/mini/MiniLedger";
import { MiniSeasonLetter } from "../components/marketing/mini/MiniSeasonLetter";

// /features — every feature that exists in the guild today, organized
// by who it serves. The visually rich ones are shown inside a
// chromeless browser frame with a live React mockup. The ones still
// in gestation are honest about what they need to ship for real.

type Status = "live" | "gestation";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  status: Status;
  to?: string;
}

const FOR_PATRONS: Feature[] = [
  {
    icon: Mail,
    title: "Letter to the artist",
    body: "Begin with a plain letter — the saint, the season, the room, the recipient. The artist replies with a vision and a quote before any money moves.",
    status: "live",
    to: "/browse",
  },
  {
    icon: Camera,
    title: "Studio reel · WIP timeline",
    body: "Studio photos and notes as the work comes together. Approve each milestone before the next release.",
    status: "live",
  },
  {
    icon: Stamp,
    title: "Provenance certificate",
    body: "Each finished work ships with a certificate: your letter, the artist's vision, the WIP timeline, the blessing, the signature.",
    status: "live",
    to: "/certificate/demo",
  },
  {
    icon: ScrollText,
    title: "The public ledger",
    body: "Every commission. Every dollar to the artist. Every dollar the guild kept. Visible by default.",
    status: "live",
    to: "/ledger",
  },
  {
    icon: Mailbox,
    title: "Letter archive",
    body: "Patrons can choose to make their letter and the artist's vision public, so the next patron sees how it's done.",
    status: "live",
    to: "/letters",
  },
  {
    icon: LibraryIcon,
    title: "The library",
    body: "Feast dates, saint patronage, the current liturgical season — at a glance.",
    status: "live",
    to: "/library",
  },
  {
    icon: Link2,
    title: "Private share URL",
    body: "Send the commission to a spouse or pastor with a signed link. Read-only, opt-in, no account needed.",
    status: "live",
  },
  {
    icon: MapIcon,
    title: "Map of the Body of Christ",
    body: "Find a hand near you — or commission across the world from a guild artist whose work fits.",
    status: "live",
    to: "/map",
  },
];

const FOR_ARTISTS: Feature[] = [
  {
    icon: Sparkles,
    title: "Vocation site + JP2 questionnaire",
    body: "Ten questions in the spirit of John Paul II's Letter to Artists. Claude Sonnet 4.6 synthesizes your answers into a public-facing mission statement, studio rhythm, and process note — and nudges you when your answers go thin.",
    status: "live",
  },
  {
    icon: Link2,
    title: "Vanity URL · arssacra.com/yourname",
    body: "Your guild profile lives at a clean URL you can put on a business card. No subdomain, no shop-name slug.",
    status: "live",
  },
  {
    icon: ShieldCheck,
    title: "Pastor's one-click endorsement",
    body: "Send a request from your editor. Your pastor gets an email, follows a signed-token link, and clicks one button. No account.",
    status: "live",
  },
  {
    icon: FileText,
    title: "Tax-ready earnings CSV",
    body: "Schedule C–shaped CSV of every released milestone. One click in January and your year is ready for the accountant.",
    status: "live",
  },
  {
    icon: Moon,
    title: "Sabbatical mode",
    body: "Set a return date. Your profile shows 'On retreat · back April 12' and the commission CTA softens to 'Leave a letter for when they return.'",
    status: "live",
  },
  {
    icon: Calendar,
    title: "Feast windows",
    body: "Tell patrons which feasts you're open to working toward this year — Advent, Annunciation, Easter, etc. Shown as a quiet strip on your profile.",
    status: "live",
  },
  {
    icon: HandHeart,
    title: "House artist designation",
    body: "Patrons who consider you their household's artist can declare it publicly. Your profile shows the anonymized count.",
    status: "live",
  },
  {
    icon: Mail,
    title: "Annual season letter",
    body: "Each Jan 1, a warm year-in-review letter from the guild — what you made, who came back, your tax footnote.",
    status: "live",
  },
  {
    icon: Users,
    title: "Patron families",
    body: "Households that have commissioned you three or more times surface as recurring patronage. Anonymized, aggregated.",
    status: "live",
  },
  {
    icon: GraduationCap,
    title: "Lineage",
    body: "Trace yourself back to a master — free text, or a link to another guild artist's page if your master is here.",
    status: "live",
  },
  {
    icon: Palette,
    title: "Palette accents",
    body: "Your portrait colors flow into the page accents on your profile via CSS custom properties.",
    status: "live",
  },
  {
    icon: Hourglass,
    title: "Studio visits / open hours",
    body: "Set the windows you're open to a patron stopping by. Patrons book a half-hour to see work in progress.",
    status: "gestation",
  },
];

const TRUST: Feature[] = [
  {
    icon: CircleDollarSign,
    title: "Escrow with milestone release",
    body: "Funds held, never co-mingled. Released only when the patron approves each milestone — deposit, midpoint, final.",
    status: "live",
  },
  {
    icon: Building2,
    title: "Diocesan landing pages",
    body: "A page per diocese listing verified artists in the region and the path for chancery outreach.",
    status: "live",
    to: "/dioceses",
  },
  {
    icon: Award,
    title: "Apprentice stipend fund",
    body: "Half of the guild's 2% tithe is earmarked for apprentice support. Visible on the ledger only when there's revenue to share.",
    status: "live",
    to: "/apprenticeships",
  },
  {
    icon: Compass,
    title: "Free for the good of the world",
    body: "No platform fee until the work is delivered. Then 2%, settled at the very end — just enough to keep the lights on.",
    status: "live",
    to: "/about",
  },
];

const GESTATION: Feature[] = [
  {
    icon: HandHeart,
    title: "Pair a commission with a Mass intention",
    body: "Have a Mass said for the person you're commissioning for — written in the priest's book, recorded alongside the artist's work.",
    status: "gestation",
    to: "/mass-intentions",
  },
  {
    icon: BookOpen,
    title: "Hand-bound book of the commission",
    body: "A keepsake binding — your letter, the artist's vision, every studio update, the final piece — sewn into cloth boards.",
    status: "gestation",
    to: "/memorabilia-book",
  },
  {
    icon: Send,
    title: "Handwritten thank-you card",
    body: "A small letterpress card with the artist's note, handwritten and signed. Mailed when the work is delivered.",
    status: "gestation",
    to: "/thank-you-card",
  },
  {
    icon: LibraryIcon,
    title: "Reference library of canonical sacred art",
    body: "Properly-licensed icons, panel paintings, mosaics — for artists to consult while at work, properly cited when shown.",
    status: "gestation",
    to: "/reference-library",
  },
  {
    icon: Camera,
    title: "Studio timelapse loops",
    body: "The studio photos stitched into an 8–12 second loop the patron receives at delivery and the artist keeps for their reel.",
    status: "gestation",
    to: "/wip-timelapse",
  },
];

export default function Features() {
  return (
    <PageShell>
      <Seo
        title="Features — every craft of the guild"
        description="The complete guild: how a commission unfolds, how artists are paid and endorsed, how the books are kept, and the few things still in gestation."
        path="/features"
      />

      <section className="container pt-16 sm:pt-24 max-w-4xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Every feature, plainly
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight text-ink leading-[1.05]">
          The whole guild,
          <span className="block italic text-burgundy-500 mt-1">
            in one room.
          </span>
        </h1>
        <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed max-w-2xl">
          Every feature here either works today on the live site, or is
          honest about what it's waiting on. We're not in the business
          of vapor. Where the work needs a real-world partner — a
          parish, a bookbinder, a stationer — we say so.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/demo">
              Walk through a commission <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/browse">Browse the guild</Link>
          </Button>
        </div>
        <Ornament className="my-12" />
      </section>

      {/* The flow — the headliner row of browser frames */}
      <section className="container max-w-6xl pb-16">
        <SectionHeading
          eyebrow="The commission, end to end"
          title="A letter, a vision, a price, a work."
          intro="Three frames you can actually read. The letter the patron writes, the vision the artist answers with, and the certificate that ships with the finished work."
        />
        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <FramedMini
            url="arssacra.com/commission/joseph-panel"
            label="Begin · letter"
          >
            <MiniLetterFlow />
          </FramedMini>
          <FramedMini
            url="arssacra.com/workspace/joseph-panel"
            label="Studio · WIP"
          >
            <MiniWipFeed />
          </FramedMini>
          <FramedMini
            url="arssacra.com/certificate/joseph-panel"
            label="Deliver · certificate"
            tone="parchment"
          >
            <MiniCertificate />
          </FramedMini>
        </div>
      </section>

      {/* Patrons */}
      <FeatureBlock
        eyebrow="For patrons"
        title="Commissioning, made plain."
        features={FOR_PATRONS}
        embellishment={
          <FramedMini
            url="arssacra.com/library"
            label="The library"
            className="max-w-md"
          >
            <MiniLibrary />
          </FramedMini>
        }
      />

      {/* Artists */}
      <FeatureBlock
        eyebrow="For artists"
        title="Tools that respect a vocation."
        features={FOR_ARTISTS}
        embellishment={
          <div className="space-y-6">
            <FramedMini
              url="arssacra.com/sr-maria-chrysostom"
              label="Your vocation site"
            >
              <MiniVocation />
            </FramedMini>
            <FramedMini
              url="arssacra.com/verify/...token"
              label="Your pastor's one-click"
            >
              <MiniEndorsement />
            </FramedMini>
          </div>
        }
      />

      {/* Trust */}
      <FeatureBlock
        eyebrow="Trust"
        title="The books, kept open."
        features={TRUST}
        embellishment={
          <div className="space-y-6">
            <FramedMini url="arssacra.com/ledger" label="Public ledger">
              <MiniLedger />
            </FramedMini>
            <FramedMini
              url="arssacra.com/your-name/edit#earnings"
              label="Your tax-ready year"
            >
              <MiniEarnings />
            </FramedMini>
          </div>
        }
      />

      {/* In gestation */}
      <section className="container max-w-6xl pt-20 sm:pt-28 pb-12">
        <SectionHeading
          eyebrow="In gestation"
          title="Five things we'd like to see."
          intro="Each of these needs a real-world dependency — a parish willing to receive Mass intentions, a bookbinder, a stationer, a curator, an R2 bucket. The pages exist; the doors are open. If you can help, write."
        />
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GESTATION.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
        <div className="mt-10 grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <FramedMini
            url="arssacra.com/inbox · Jan 1"
            label="Annual season letter"
          >
            <MiniSeasonLetter />
          </FramedMini>
          <div className="rounded-md border border-ink/10 bg-parchment-100/40 p-6">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-burgundy-500 mb-2">
              What we won't do
            </div>
            <h3 className="font-display text-2xl text-ink leading-tight">
              No race-to-the-bottom bidding. No engagement metrics. No
              algorithm choosing your artist for you.
            </h3>
            <p className="mt-3 font-serif text-base text-ink-soft leading-relaxed">
              The whole guild is a covenant — between artist and
              patron, with the priest's endorsement at the door and
              the bookkeeper visible to all. If a feature would
              cheapen any of that, we don't ship it.
            </p>
            <div className="mt-5">
              <Button asChild variant="outline">
                <Link to="/manifesto">Read the manifesto</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container max-w-4xl pt-12 pb-24">
        <div className="rounded-md border border-ink/10 bg-ink text-parchment-50 px-6 sm:px-12 py-12 text-center">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-300 mb-3">
            Now you've seen it
          </div>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight leading-tight">
            Walk through a commission yourself.
          </h2>
          <p className="mt-4 font-serif text-parchment-200/90 max-w-xl mx-auto">
            A guided demo — eight steps from the letter to the certificate.
            No signup, no real money. Built so you can show a friend.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="gold">
              <Link to="/demo">
                Start the walkthrough <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-parchment-50/40 text-parchment-50 hover:bg-parchment-50/10"
            >
              <Link to="/browse">Browse the guild</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function FeatureBlock({
  eyebrow,
  title,
  features,
  embellishment,
}: {
  eyebrow: string;
  title: string;
  features: Feature[];
  embellishment?: React.ReactNode;
}) {
  return (
    <section className="border-y border-ink/10 bg-parchment-100/40">
      <div className="container max-w-6xl py-20 sm:py-28">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="mt-10 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>
          {embellishment && (
            <div className="lg:col-span-5">{embellishment}</div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  const card = (
    <div className="h-full rounded-md border border-ink/10 bg-parchment-50 p-5 hover:border-burgundy-500/40 hover:shadow-card transition-all">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-burgundy-500/10 text-burgundy-500">
          <Icon className="h-4 w-4" />
        </div>
        <div className="grow min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base text-ink leading-tight">
              {feature.title}
            </h3>
            {feature.status === "live" ? (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-olive-500/10 px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-[0.18em] text-olive-600">
                <CheckCircle2 className="h-2.5 w-2.5" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-gold-500/10 px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-[0.18em] text-gold-600">
                <Clock className="h-2.5 w-2.5" /> In gestation
              </span>
            )}
          </div>
          <p className="mt-1.5 font-serif text-sm text-ink-soft leading-snug">
            {feature.body}
          </p>
          {feature.to && (
            <Link
              to={feature.to}
              className="mt-2 inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-[0.18em] text-burgundy-500 hover:text-burgundy-600"
            >
              See it <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
  return card;
}

function FramedMini({
  url,
  label,
  children,
  className,
  tone,
}: {
  url: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  tone?: "parchment" | "ink";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2 px-1">
        {label}
      </div>
      <BrowserFrame url={url} tone={tone}>
        {children}
      </BrowserFrame>
    </motion.div>
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
      <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-ink leading-[1.05]">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 font-serif text-lg text-ink-soft leading-relaxed">
          {intro}
        </p>
      )}
    </div>
  );
}
