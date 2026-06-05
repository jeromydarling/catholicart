// Mini mockup: the letter-to-vision-to-quote loop. Patron writes a
// letter, artist answers with a vision, then names a price. We show
// all three side-by-side so the viewer can see how the conversation
// actually unfolds before any money moves.

export function MiniLetterFlow() {
  return (
    <div className="p-5 sm:p-6 space-y-3">
      <Card
        label="From the patron"
        body="I'd like a small panel of St. Joseph for our nursery. A working-man Joseph — sleeves rolled, plane in hand. For our second son, due Easter."
        accent="burgundy"
      />
      <Card
        label="The artist's vision"
        body="A panel 12×16, egg tempera on poplar. Joseph half-turned at his bench in the lower workshop light, the Child glimpsed asleep in shavings. Gold-leaf nimbus. Three months. I'll send the first study within ten days."
        accent="olive"
      />
      <Card
        label="And the quote"
        body="$2,400 — deposit $800 to begin, $800 at the midpoint study, $800 on delivery. The 2% guild tithe ($48) is settled at the end."
        accent="gold"
      />
    </div>
  );
}

function Card({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent: "burgundy" | "olive" | "gold";
}) {
  const tone = {
    burgundy: "border-burgundy-500/30 bg-burgundy-500/5 text-burgundy-500",
    olive: "border-olive-500/30 bg-olive-500/5 text-olive-600",
    gold: "border-gold-500/30 bg-gold-500/5 text-gold-600",
  }[accent];
  return (
    <div className={`rounded-md border ${tone} p-3`}>
      <div className="font-sans text-[9px] uppercase tracking-[0.18em] mb-1.5">
        {label}
      </div>
      <p className="font-serif text-[12px] text-ink-soft leading-snug">
        {body}
      </p>
    </div>
  );
}
