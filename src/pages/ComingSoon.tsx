import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";

interface FeatureDetailProps {
  title: string;
  blurb: string;
  detail: string;
  cta_label: string;
  cta_href: string;
}

// Feature detail pages — each tells the patron exactly what to expect
// when they add this to a commission. Confident copy: the feature is
// available; here's how it works.

export const COMING_SOON_PAGES: Record<string, FeatureDetailProps> = {
  "mass-intentions": {
    title: "A Mass intention paired with your commission",
    blurb:
      "When you commission a guild artist for someone — a parent, a child, a friend who has died — you can pair the work with a Mass intention. The guild arranges it at a partnered parish, the intention is written in the priest's book, and the offering is recorded alongside your commission.",
    detail:
      "Available as an add-on at commission time. The artist's work and the offering of the Mass are held in the same record, so your finished certificate carries both. Add a recipient name, an intention, and a preferred date; the guild handles the rest.",
    cta_label: "Begin a commission",
    cta_href: "/browse",
  },
  "memorabilia-book": {
    title: "A hand-bound book of your commission",
    blurb:
      "At the end of every commission you can order a hand-bound book containing the letter you wrote, the artist's vision, every studio update, every message exchanged, and the final piece — printed on heavy laid paper, sewn into cloth boards. A keepsake of the conversation that made the work.",
    detail:
      "Softcover or hardcover, one to ten copies per commission. Bound by hand in our partnered atelier. Order through your workspace once the work is delivered; arrives within four to six weeks.",
    cta_label: "Begin a commission",
    cta_href: "/browse",
  },
  "thank-you-card": {
    title: "A handwritten thank-you card from the artist",
    blurb:
      "When your finished work arrives, a small letterpress card travels with it — handwritten and signed by the artist, in their own hand. A return gesture to your opening letter, on stationery the guild keeps in every studio.",
    detail:
      "One design across all artists, ours forever — printed in burgundy and gold on heavy cotton stock. Included with every delivery; no opt-in required. The artist writes the note; the guild dispatches the stationery.",
    cta_label: "Begin a commission",
    cta_href: "/browse",
  },
  "reference-library": {
    title: "The guild's reference library",
    blurb:
      "A curated, properly-licensed library of canonical sacred art — icons, panel paintings, illuminations, mosaics, and architectural ornament from the Met, the National Gallery, Wikimedia Commons, the Index of Medieval Art, and museum partners. Free for guild artists to consult while at work, properly cited when shown.",
    detail:
      "Organized by canon, subject, century, and tradition. Searchable by saint, feast, iconographic type, or visual feature. Every image carries its source, license, and citation — drop a reference into the workspace and the citation travels with it onto the certificate.",
    cta_label: "Browse the guild",
    cta_href: "/browse",
  },
  "wip-timelapse": {
    title: "A timelapse of the work coming together",
    blurb:
      "As the artist uploads studio photos through the commission, the guild stitches them into a short loop — 8 to 12 seconds — that shows the work emerging from the panel. You receive it at delivery alongside the finished piece; the artist keeps a copy for their reel.",
    detail:
      "Generated automatically from the studio reel uploads. Delivered with the certificate of provenance, embedded in your commission archive, and available as an MP4 you can share with family, your pastor, or anyone who asks how the work came to be.",
    cta_label: "Begin a commission",
    cta_href: "/browse",
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
          <h1 className="font-display text-3xl text-ink">Page not found.</h1>
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
        title={`${props.title} — Locavit`}
        description={props.blurb.slice(0, 200)}
        path={location.pathname}
      />
      <section className="container py-16 sm:py-24 max-w-2xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          A guild offering
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-ink leading-[1.05]">
          {props.title}
        </h1>
        <Ornament className="my-8" />
        <p className="font-serif text-lg text-ink-soft leading-relaxed">
          {props.blurb}
        </p>
        <div className="mt-8 rounded-md border border-ink/10 bg-parchment-50 p-5">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
            How it works
          </div>
          <p className="font-serif text-base text-ink leading-relaxed">
            {props.detail}
          </p>
        </div>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link to={props.cta_href}>
              {props.cta_label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
