// Mini mockup: the annual season letter — sent to each artist Jan 1.
// A warm, non-transactional year-in-review with the tax footnote.

export function MiniSeasonLetter() {
  return (
    <div className="p-5 sm:p-6 font-serif text-ink">
      <div className="font-sans text-[9px] uppercase tracking-[0.22em] text-gold-600 mb-2">
        January 1, 2026 · From the guild
      </div>
      <p className="text-[12px] leading-relaxed">
        Dear Sr. Maria,
      </p>
      <p className="mt-2 text-[12px] leading-relaxed">
        Eight commissions to your hand this year. One Annunciation
        diptych traveled as far as Manila; one small Pietà found a
        bedside in Vermont. Three of the patron households have now
        commissioned you more than once — they are, by any old
        standard, your patrons in the proper sense.
      </p>
      <p className="mt-2 text-[12px] leading-relaxed italic text-ink-soft">
        We pray your studio stays full and your stillness deeper.
      </p>
      <p className="mt-2 text-[12px] leading-relaxed">— the guild</p>
      <hr className="my-3 border-t border-ink/10" />
      <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
        Footnote · for your accountant
      </div>
      <div className="mt-1 font-display text-sm tabular-nums">
        $9,840 to your hand in 2025
      </div>
      <div className="font-sans text-[10px] text-ink-muted">
        Detailed CSV in your editor.
      </div>
    </div>
  );
}
