import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  CircleDollarSign,
  Compass,
  FileText,
  Film,
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
import { useT } from "../i18n";

// /features — the complete catalog of what Locavit does, organized
// by who it serves. Browser frames wrap live React renderings of the
// real pages so the marketing visuals stay in sync with the app.

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  to?: string;
}

const FOR_PATRONS: Feature[] = [
  {
    icon: Mail,
    title: "Letter to the artist",
    body: "Begin with a plain letter — the saint, the season, the room, the recipient. The artist answers with a vision and a quote before any money moves.",
    to: "/browse",
  },
  {
    icon: Camera,
    title: "Studio reel · WIP timeline",
    body: "Studio photos and notes as the work comes together. Approve each milestone before the next release.",
  },
  {
    icon: Stamp,
    title: "Provenance certificate",
    body: "Every finished work ships with a printed certificate: your letter, the artist's vision, the studio timeline, the blessing, the signature.",
  },
  {
    icon: ScrollText,
    title: "The public ledger",
    body: "Every commission. Every dollar to the artist. Every dollar the guild kept. Visible by default.",
    to: "/ledger",
  },
  {
    icon: Mailbox,
    title: "Letter archive",
    body: "Make your letter and the artist's vision public so the next patron can see how it's done. Opt-in, per commission.",
    to: "/letters",
  },
  {
    icon: LibraryIcon,
    title: "The library",
    body: "Feast dates, saint patronage, the current liturgical season — at a glance.",
    to: "/library",
  },
  {
    icon: Link2,
    title: "Private share URL",
    body: "Send the commission to a spouse or pastor with a signed link. Read-only, opt-in, no account needed.",
  },
  {
    icon: MapIcon,
    title: "Map of the Body of Christ",
    body: "Find a hand near you — or commission across the world from a guild artist whose work fits.",
    to: "/map",
  },
  {
    icon: HandHeart,
    title: "A Mass intention paired with your commission",
    body: "When you commission for someone — a parent, a child, a friend who has died — the guild arranges a Mass said for them at a partnered parish, the intention written in the priest's book.",
    to: "/mass-intentions",
  },
  {
    icon: BookOpen,
    title: "Hand-bound book of the commission",
    body: "Order a keepsake binding at the end of the commission: your letter, the artist's vision, every studio update, every message, the final piece — printed on heavy laid paper, sewn into cloth boards.",
    to: "/memorabilia-book",
  },
  {
    icon: Send,
    title: "Handwritten thank-you card from the artist",
    body: "A small letterpress card arrives with the work — handwritten, signed in the artist's own hand. A return gesture to your opening letter.",
    to: "/thank-you-card",
  },
  {
    icon: Film,
    title: "Studio timelapse loop",
    body: "The studio photos stitched into an 8–12 second loop you receive at delivery — the work emerging from the panel, in your hand.",
    to: "/wip-timelapse",
  },
];

const FOR_ARTISTS: Feature[] = [
  {
    icon: Sparkles,
    title: "Vocation site + JP2 questionnaire",
    body: "Ten questions in the spirit of John Paul II's Letter to Artists. Claude Sonnet 4.6 synthesizes your answers into a public-facing mission statement, studio rhythm, and process note — and nudges you when your answers go thin.",
  },
  {
    icon: Link2,
    title: "Vanity URL · locavit.com/yourname",
    body: "Your guild profile lives at a clean URL you can put on a business card. No subdomain, no shop-name slug.",
  },
  {
    icon: ShieldCheck,
    title: "Pastor's one-click endorsement",
    body: "Send a request from your editor. Your pastor gets an email, follows a signed-token link, and clicks one button. No account.",
  },
  {
    icon: FileText,
    title: "Tax-ready earnings CSV",
    body: "Schedule C–shaped CSV of every released milestone. One click in January and your year is ready for the accountant.",
  },
  {
    icon: Moon,
    title: "Sabbatical mode",
    body: "Set a return date. Your profile shows 'On retreat · back April 12' and the commission CTA softens to 'Leave a letter for when they return.'",
  },
  {
    icon: Calendar,
    title: "Feast windows",
    body: "Tell patrons which feasts you're open to working toward this year — Advent, Annunciation, Easter, and the rest. Shown as a quiet strip on your profile.",
  },
  {
    icon: HandHeart,
    title: "House artist designation",
    body: "Patrons who consider you their household's artist can declare it publicly. Your profile shows the anonymized count.",
  },
  {
    icon: Mail,
    title: "Annual season letter",
    body: "Each January 1st, a warm year-in-review letter from the guild — what you made, who came back, your tax footnote.",
  },
  {
    icon: Users,
    title: "Patron families",
    body: "Households that have commissioned you three or more times surface as recurring patronage. Anonymized, aggregated.",
  },
  {
    icon: GraduationCap,
    title: "Lineage",
    body: "Trace yourself back to a master — free text, or a link to another guild artist's page if your master is here too.",
  },
  {
    icon: Palette,
    title: "Palette accents",
    body: "Your portrait colors flow into the page accents on your profile via CSS custom properties. Your room, your colors.",
  },
  {
    icon: Hourglass,
    title: "Studio visits & open hours",
    body: "Set the windows you're open to a patron stopping by. Patrons book a half-hour to see work in progress.",
  },
  {
    icon: LibraryIcon,
    title: "Reference library of canonical sacred art",
    body: "Properly-licensed icons, panel paintings, illuminations, mosaics, and architectural ornament — free to consult while at work, properly cited when shown.",
    to: "/reference-library",
  },
];

const TRUST: Feature[] = [
  {
    icon: CircleDollarSign,
    title: "Escrow with milestone release",
    body: "Funds held, never co-mingled. Released only when the patron approves each milestone — deposit, midpoint, final.",
  },
  {
    icon: Building2,
    title: "Diocesan & parish partnerships",
    body: "Dioceses, parishes, and religious institutions can commission through a multi-stakeholder approval flow with NET-30 invoicing.",
    to: "/partnerships",
  },
  {
    icon: Award,
    title: "Apprentice stipend fund",
    body: "Half of the guild's 2% tithe is earmarked for apprentice support — funding the next generation of masters.",
    to: "/apprenticeships",
  },
  {
    icon: Compass,
    title: "Free for the good of the world",
    body: "No platform fee until the work is delivered. Then 2%, settled at the very end — just enough to keep the lights on.",
    to: "/about",
  },
];

export default function Features() {
  const { t } = useT();
  return (
    <PageShell>
      <Seo
        title="Features — Locavit"
        description="The complete Locavit guild: how a commission unfolds, how artists are paid and endorsed, how the books are kept open. Every craft of the guild in one room."
        path="/features"
      />

      <section className="container pt-16 sm:pt-24 max-w-4xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          {t("features.kicker")}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight text-ink leading-[1.05]">
          {t("features.title.line1")}
          <span className="block italic text-burgundy-500 mt-1">
            {t("features.title.line2")}
          </span>
        </h1>
        <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed max-w-2xl">
          {t("features.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/demo">
              {t("features.cta.demo")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/browse">{t("features.cta.browse")}</Link>
          </Button>
        </div>
        <Ornament className="my-12" />
      </section>

      {/* The flow — the headliner row of browser frames */}
      <section className="container max-w-6xl pb-16">
        <SectionHeading
          eyebrow="The commission, end to end"
          title="A letter, a vision, a price, a work."
          intro="The letter the patron writes, the studio reel during the making, and the certificate that ships with the finished work. Three rooms of the same house."
        />
        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <FramedMini
            url="locavit.com/commission/joseph-panel"
            label="Begin · letter"
          >
            <MiniLetterFlow />
          </FramedMini>
          <FramedMini
            url="locavit.com/workspace/joseph-panel"
            label="Studio · WIP"
          >
            <MiniWipFeed />
          </FramedMini>
          <FramedMini
            url="locavit.com/certificate/joseph-panel"
            label="Deliver · certificate"
            tone="parchment"
          >
            <MiniCertificate />
          </FramedMini>
        </div>
      </section>

      <FeatureBlock
        eyebrow="For patrons"
        title="Commissioning, made plain."
        features={FOR_PATRONS}
        embellishment={
          <FramedMini
            url="locavit.com/library"
            label="The library"
            className="max-w-md"
          >
            <MiniLibrary />
          </FramedMini>
        }
      />

      <FeatureBlock
        eyebrow="For artists"
        title="Tools that respect a vocation."
        features={FOR_ARTISTS}
        embellishment={
          <div className="space-y-6">
            <FramedMini
              url="locavit.com/sr-maria-chrysostom"
              label="Your vocation site"
            >
              <MiniVocation />
            </FramedMini>
            <FramedMini
              url="locavit.com/verify/...token"
              label="Your pastor's one-click"
            >
              <MiniEndorsement />
            </FramedMini>
          </div>
        }
      />

      <FeatureBlock
        eyebrow="Trust"
        title="The books, kept open."
        features={TRUST}
        embellishment={
          <div className="space-y-6">
            <FramedMini url="locavit.com/ledger" label="Public ledger">
              <MiniLedger />
            </FramedMini>
            <FramedMini
              url="locavit.com/your-name/edit#earnings"
              label="Your tax-ready year"
            >
              <MiniEarnings />
            </FramedMini>
          </div>
        }
      />

      {/* What we don't do + Season letter — two halves of the same conviction */}
      <section className="container max-w-6xl pt-20 sm:pt-28 pb-12">
        <SectionHeading
          eyebrow="The shape of the place"
          title="A covenant, not a marketplace."
        />
        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <FramedMini
            url="locavit.com/inbox · Jan 1"
            label="Annual season letter"
          >
            <MiniSeasonLetter />
          </FramedMini>
          <div className="rounded-md border border-ink/10 bg-parchment-100/40 p-6 sm:p-8">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-burgundy-500 mb-2">
              What you won't find here
            </div>
            <h3 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
              No race-to-the-bottom bidding. No engagement metrics. No
              algorithm choosing your artist for you.
            </h3>
            <p className="mt-4 font-serif text-base text-ink-soft leading-relaxed">
              Every artist on Locavit is endorsed by a parish priest, a
              religious superior, or a chancery. Every commission is a
              real conversation with a real person — beginning with a
              letter, ending with a certificate signed by hand.
            </p>
            <div className="mt-6">
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
            A guided tour — eight steps from the letter to the
            certificate. Built so you can show a friend in two minutes.
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
              <Link to="/browse">Commission an artist</Link>
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
  return (
    <div className="h-full rounded-md border border-ink/10 bg-parchment-50 p-5 hover:border-burgundy-500/40 hover:shadow-card transition-all">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-burgundy-500/10 text-burgundy-500">
          <Icon className="h-4 w-4" />
        </div>
        <div className="grow min-w-0">
          <h3 className="font-display text-base text-ink leading-tight">
            {feature.title}
          </h3>
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
