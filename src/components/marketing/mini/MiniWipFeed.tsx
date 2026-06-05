import { motion } from "motion/react";

// Mini mockup: the WIP feed the patron sees as the work comes
// together. Three studio photos in a vertical timeline with the
// artist's caption. The dates are illustrative — the goal is to make
// "you'll actually see this being made" tangible.

const POSTS = [
  {
    when: "Day 4",
    caption:
      "Gesso laid. Five thin coats with sandings between. The grain has lifted nicely.",
    swatch: ["#f5e8c8", "#d8c499"],
  },
  {
    when: "Day 21",
    caption:
      "Underdrawing transferred from the cartoon. Joseph's hands gave the longest trouble.",
    swatch: ["#a4956e", "#665a3e"],
  },
  {
    when: "Day 52",
    caption:
      "First gold-leaf nimbus floated and burnished. Tomorrow: green-earth flesh underpaint.",
    swatch: ["#b9892b", "#5f3f0e"],
  },
];

export function MiniWipFeed() {
  return (
    <div className="p-5 sm:p-6">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
        Studio reel · St. Joseph panel
      </div>
      <ol className="space-y-3">
        {POSTS.map((p, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ delay: i * 0.15 }}
            className="flex gap-3"
          >
            <div
              className="h-16 w-16 shrink-0 rounded-sm"
              style={{
                background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})`,
              }}
              aria-hidden
            />
            <div className="grow min-w-0">
              <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                {p.when}
              </div>
              <p className="font-serif text-[12px] text-ink-soft leading-snug mt-0.5">
                {p.caption}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
      <div className="mt-4 rounded-sm border border-dashed border-ink/15 p-2.5 text-center font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        + 14 more updates · midpoint approval pending
      </div>
    </div>
  );
}
