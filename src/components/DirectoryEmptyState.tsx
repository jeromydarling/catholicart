import { Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "./ui/button";
import { Ornament } from "./Ornament";

// Rendered on /browse and /map while the guild directory is being
// populated with real, researched artists. Confident copy: an
// invitation, not an apology.

interface Props {
  surface: "browse" | "map";
}

export function DirectoryEmptyState({ surface }: Props) {
  return (
    <section className="container py-20 sm:py-28 max-w-2xl text-center">
      <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
        The guild is being assembled
      </div>
      <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-burgundy-500 text-parchment-50">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="font-display text-3xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
        {surface === "map"
          ? "A map of the Body of Christ."
          : "A guild of Catholic artists."}
      </h1>
      <Ornament className="my-7" />
      <p className="font-serif text-lg text-ink-soft leading-relaxed">
        Locavit is curating a working directory of living Catholic
        sacred artists and religious-order workshops — iconographers,
        panel painters, sculptors, vestment makers, glass artists,
        composers — from monasteries and ateliers around the world.
      </p>
      <p className="mt-4 font-serif text-base text-ink-muted leading-relaxed">
        When the {surface === "map" ? "map" : "guild"} opens, every
        artist listed will be a real person doing real work, with a
        pastor's endorsement at the door.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/features">
            See every feature <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/signup/artist">Are you a Catholic artist?</Link>
        </Button>
      </div>
      <p className="mt-10 font-serif italic text-sm text-ink-muted">
        If you make sacred art and you'd like to be among the founding
        members, write{" "}
        <a
          href="mailto:hello@locavit.com"
          className="text-burgundy-500 hover:text-burgundy-600 not-italic underline underline-offset-2"
        >
          hello@locavit.com
        </a>
        .
      </p>
    </section>
  );
}
