import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, AlertOctagon, Eye, Flame } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";

// The Anti-Kitsch Report — a quarterly broadside. We name names (or
// anti-names): the patterns of failure that flatten the faith. The
// editorial voice is sharp and serious; the visual treatment is
// pamphlet-grade.
export default function Report() {
  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="absolute inset-0 bg-gradient-to-br from-burgundy-500/10 via-parchment-50 to-gold-500/5" aria-hidden />
        <div className="relative container py-16 sm:py-24 max-w-4xl">
          <div className="font-sans text-[11px] uppercase tracking-[0.32em] text-burgundy-500 mb-4">
            The Anti-Kitsch Report · No. 1
          </div>
          <h1
            className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] tracking-tight text-ink leading-[0.95]"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Kitsch is a <span className="italic text-burgundy-500">spiritual</span> problem.
          </h1>
          <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft max-w-2xl leading-relaxed">
            It dulls the eye. It softens the edges of the Gospel. It makes
            sanctity look like sentimentality. We publish this report so
            patrons know what they're buying — and what they're refusing.
          </p>
          <Ornament className="mt-10" />
        </div>
      </section>

      {/* The thesis */}
      <section className="container py-16 sm:py-20 max-w-3xl">
        <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
          A working definition.
        </h2>
        <p className="mt-5 font-serif text-lg text-ink-soft leading-relaxed">
          <strong className="text-ink">Kitsch</strong> is the production of
          stock emotion using stock symbols. It is the avoidance of difficulty.
          It is what happens when an artist tries to make the viewer{" "}
          <em>feel something</em> without first making them <em>see something</em>.
          Kitsch is the failure mode of beauty itself.
        </p>
        <p className="mt-4 font-serif text-lg text-ink-soft leading-relaxed">
          A pious heart can be moved by kitsch. So can a bored one. The
          difference between holy art and kitsch is not piety. It is{" "}
          <em>truth</em>: the saint as he was, the suffering as it is, the
          mystery without varnish.
        </p>
      </section>

      <Ornament className="my-4" />

      {/* The five failures */}
      <section className="container py-12 sm:py-16">
        <div className="max-w-3xl">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
            The five failures
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
            What we will not commission.
          </h2>
        </div>

        <ul className="mt-12 space-y-12">
          <Failure
            n="I."
            title="The Gift-Shop Saint"
            tag="Sentimentality"
            body="Wide-eyed, blushing, pastel-haloed. The saint reduced to a 'comfort character.' The body of someone who fasted, was beaten, and bled out is presented as a cuddly figurine. The viewer is invited to feel cozy, not converted. We refuse this on theological grounds: the saints are intercessors and intercessors are dangerous."
            icon={<Eye className="h-5 w-5" />}
          />
          <Failure
            n="II."
            title="The Bureaucratic Modern"
            tag="Avoidance"
            body="The 'modern' altarpiece that refuses subject. A wash of color where Christ should be. A cross so abstracted you cannot find the body on it. Often defended as 'reverent ambiguity'; in fact a refusal of incarnation. The Word became flesh, not a vibe."
            icon={<AlertOctagon className="h-5 w-5" />}
          />
          <Failure
            n="III."
            title="AI Slop"
            tag="Hollow"
            body="Six-fingered Madonnas. Halos that bleed into eyes. The image-as-soup. We do not take a moral position on machine assistance — every artist uses tools. We take an aesthetic position: a work that nobody made cannot bear witness to anyone. Faith is not a prompt."
            icon={<Flame className="h-5 w-5" />}
          />
          <Failure
            n="IV."
            title="The Polychrome Plastic"
            tag="Cheap"
            body="The injection-molded statue, bought from a catalog, blessed in its parking-lot box, installed beneath a fluorescent light. We do not hate the parishioners who buy these. We hate the supply chain that thinks they deserve nothing better. A real body in real wood, even small, does more for catechesis than a hundred sanctified plastics."
            icon={<AlertOctagon className="h-5 w-5" />}
          />
          <Failure
            n="V."
            title="The Pious Pastiche"
            tag="Imitation"
            body="The 'in the style of' icon, copied with care but without understanding. Byzantine geometry without Byzantine theology. A Caravaggio chiaroscuro slapped over a sentimental subject. Style is a language; you cannot speak it without paying its grammar. We commission artists who have learned a tradition from inside it."
            icon={<Eye className="h-5 w-5" />}
          />
        </ul>
      </section>

      {/* What we want */}
      <section className="bg-ink text-parchment-50">
        <div className="container py-20 sm:py-28 max-w-4xl">
          <div className="font-sans text-[11px] uppercase tracking-[0.32em] text-gold-300 mb-4">
            By contrast
          </div>
          <h2
            className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            What we will commission.
          </h2>
          <p className="mt-6 font-serif text-lg sm:text-xl text-parchment-100 leading-relaxed max-w-2xl">
            Work that has been <em>looked at</em>. Work in which the artist's
            hand is visible because they were there. Work that holds up at six
            inches and at sixty feet. Work that takes longer than a
            push-notification cycle to make. Work in which the saint, the
            mystery, the cross, the body — looks back at you.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/browse">Commission an artist</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-parchment-50 border-parchment-50/40 hover:bg-parchment-50/10 hover:border-parchment-50/70">
              <Link to="/manifesto">Read the manifesto</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container my-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "Beauty will save the world — but only if it is beauty, and not
          its impostor."
        </p>
        <div className="mt-2 font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
          The editors
        </div>
      </section>
    </PageShell>
  );
}

function Failure({
  n,
  title,
  tag,
  body,
  icon,
}: {
  n: string;
  title: string;
  tag: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="grid lg:grid-cols-12 gap-6 lg:gap-10 border-t border-ink/10 pt-12"
    >
      <div className="lg:col-span-3">
        <div className="font-display italic text-5xl sm:text-6xl text-burgundy-500/80 leading-none">
          {n}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-burgundy-500/10 text-burgundy-500">
            {icon}
          </span>
          {tag}
        </div>
      </div>
      <div className="lg:col-span-9">
        <h3 className="font-display text-3xl text-ink leading-tight">
          {title}
        </h3>
        <p className="mt-4 font-serif text-lg text-ink-soft leading-relaxed max-w-prose">
          {body}
        </p>
      </div>
    </motion.li>
  );
}

ArrowRight; // keep import live
