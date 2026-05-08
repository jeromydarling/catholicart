import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";

export default function NotFound() {
  return (
    <PageShell>
      <section className="container py-24 sm:py-32 text-center">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Lost
        </div>
        <h1 className="font-display text-6xl sm:text-7xl text-ink">
          ✣ <span className="italic">Non hic est</span>
        </h1>
        <p className="mt-4 font-serif italic text-ink-muted">
          “He is not here.” — Mt 28:6
        </p>
        <Ornament className="my-10" />
        <p className="font-serif text-lg text-ink-soft max-w-md mx-auto">
          The page you sought is not in our register. Perhaps it has gone to
          the workshop.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Return home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/browse">Browse the guild</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
