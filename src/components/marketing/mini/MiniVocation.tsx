import { motion } from "motion/react";
import { ShieldCheck, Sparkles } from "lucide-react";

// Mini mockup: artist vocation site — the public profile after a synth.
// Used in marketing to show what an artist's page actually looks like
// once the JP2 questionnaire is filled out and Sonnet has synthesized
// the mission_statement / studio_rhythm / process_note.

export function MiniVocation() {
  return (
    <div className="p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-sm bg-olive-500/15 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.18em] text-olive-600">
          <ShieldCheck className="h-2.5 w-2.5" /> Pastor-endorsed
        </span>
        <span className="rounded-sm bg-burgundy-500/15 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.18em] text-burgundy-500">
          Iconography
        </span>
      </div>
      <h3 className="font-display text-2xl text-ink leading-tight">
        <span className="text-ink-muted text-base mr-1.5">Sr.</span>
        Maria Chrysostom
      </h3>
      <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted mt-1">
        Florence · IT · St. Catherine of Siena
      </div>
      <hr className="my-4 border-t border-ink/10" />
      <div className="font-display italic text-base text-ink leading-snug">
        “Every line a prayer; every panel an altar.”
      </div>
      <div className="mt-4 rounded-md border border-gold-500/30 bg-gold-500/5 p-3">
        <div className="flex items-center gap-1.5 font-sans text-[9px] uppercase tracking-[0.18em] text-gold-600 mb-1">
          <Sparkles className="h-2.5 w-2.5" /> Synthesized by Sonnet
        </div>
        <p className="font-serif text-[12px] text-ink-soft leading-snug">
          She paints in egg tempera on gessoed panel, beginning each
          morning with Lauds. Commissions are received by letter and
          answered with a vision before any price is named.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 grid grid-cols-3 gap-1.5"
      >
        {[
          ["#7a3a3a", "#2a0e0e"],
          ["#a06a3a", "#4a2510"],
          ["#7a8e4a", "#2a3a1a"],
        ].map(([a, b], i) => (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
            aria-hidden
          />
        ))}
      </motion.div>
      <div className="mt-3 font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
        Working toward · Advent · Annunciation · Easter
      </div>
    </div>
  );
}
