import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";

interface ComingSoonProps {
  title: string;
  blurb: string;
  what_we_need: string;
  contact_label?: string;
  contact_href?: string;
}

// Five features genuinely require a real-world dependency. Each gets a
// scaffolded page that explains the intent honestly and gives a way to
// help bring it about. When the dependency is in place, swap the page
// for the working version.
export const COMING_SOON_PAGES: Record<string, ComingSoonProps> = {
  "mass-intentions": {
    title: "Pair a commission with a Mass intention",
    blurb:
      "When you commission a guild artist for someone — a parent, a child, a friend who has died — you can also have a Mass said for them at a guild-aligned parish, with the intention written in the priest's book. The artist's work and the offering of the Mass go together. We hold both in the same record.",
    what_we_need:
      "A parish willing to receive guild Mass intentions and remit a small offering for each. If you are a pastor, religious superior, or a household with a parish relationship that could carry this — write to us.",
    contact_label: "Talk to the guild",
    contact_href: "/partnerships",
  },
  "memorabilia-book": {
    title: "A hand-bound book of the commission",
    blurb:
      "At the end of every commission, you can order a hand-bound book containing the letter you wrote, the artist's vision, every studio update, every message, and the final piece — printed on heavy laid paper, sewn into cloth boards. A keepsake of the conversation that made the work.",
    what_we_need:
      "A bookbinder who can make small runs (one to ten copies) of softcover or hardcover commemorative books on the order of a few weeks per book, with a price point that respects the patron. If you bind books, or know someone who does — write to us.",
    contact_label: "Talk to the guild",
    contact_href: "/partnerships",
  },
  "thank-you-card": {
    title: "A handwritten thank-you card from the artist",
    blurb:
      "When you receive your finished work, you also receive a small letterpress card from the artist — handwritten, signed, in their own hand. The system sends the stationery; the artist writes the note. A return gesture to your opening letter.",
    what_we_need:
      "A stationer or letterpress shop that can produce the guild's cards (one design across all artists, ours forever) and dispatch them on demand with the artist's address on file. If you make stationery and want to help — write to us.",
    contact_label: "Talk to the guild",
    contact_href: "/partnerships",
  },
  "reference-library": {
    title: "A reference library of canonical sacred art",
    blurb:
      "A growing, properly-licensed library of icons, panel paintings, illuminations, mosaics, and architectural ornament from the Met, the National Gallery, Wikimedia Commons, the Index of Medieval Art, and museum partners. Free for guild artists to consult while at work — properly cited when shown.",
    what_we_need:
      "A focused pass through public-domain and CC-licensed sacred art collections, organized by canon, subject, and century. The Met's Open Access program and Wikimedia Commons cover most of what we'd want; we need a curator, not a budget.",
    contact_label: "Help curate",
    contact_href: "/partnerships",
  },
  "wip-timelapse": {
    title: "A timelapse of the work coming together",
    blurb:
      "When the artist uploads a series of studio photos, the system stitches them into a short loop — 8 to 12 seconds — that shows the work emerging from the panel. The patron receives it at delivery; the artist keeps a copy for their reel.",
    what_we_need:
      "The R2 bucket isn't created yet (our Cloudflare token lacks R2 scope). One click in the dashboard creates it, the upload endpoints we already shipped flip on, and this page becomes the working feature.",
    contact_label: "See the morning briefing",
    contact_href: "/",
  },
};

export default function ComingSoon({
  pageKey,
}: {
  pageKey?: keyof typeof COMING_SOON_PAGES;
}) {
  const location = useLocation();
  const inferredKey = (pageKey ??
    (location.pathname.split("/").pop() as keyof typeof COMING_SOON_PAGES)) as keyof typeof COMING_SOON_PAGES;
  const props = COMING_SOON_PAGES[inferredKey];
  if (!props) {
    return (
      <PageShell>
        <section className="container py-24 max-w-xl text-center">
          <h1 className="font-display text-3xl text-ink">Not yet a page.</h1>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Home</Link>
          </Button>
        </section>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <Seo
        title={`${props.title} — Ars Sacra`}
        description={props.blurb.slice(0, 200)}
        path={location.pathname}
      />
      <section className="container py-16 sm:py-24 max-w-2xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          In gestation
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-ink leading-[1.05]">
          {props.title}
        </h1>
        <Ornament className="my-8" />
        <p className="font-serif text-lg text-ink-soft leading-relaxed">
          {props.blurb}
        </p>
        <div className="mt-8 rounded-md border border-ink/10 bg-parchment-50 p-5">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-burgundy-500 mb-2">
            What this needs
          </div>
          <p className="font-serif text-base text-ink leading-relaxed">
            {props.what_we_need}
          </p>
        </div>
        {props.contact_label && props.contact_href && (
          <div className="mt-8">
            <Button asChild>
              <Link to={props.contact_href}>
                {props.contact_label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </section>
    </PageShell>
  );
}
