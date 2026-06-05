// Mini mockup: the provenance certificate that ships with every
// commission. Patron letter (anonymized), artist's vision, key WIP
// stages, blessing date, artist signature line.

export function MiniCertificate() {
  return (
    <div className="p-5 sm:p-6 bg-parchment-50 font-serif text-ink">
      <div className="text-center">
        <div className="font-sans text-[9px] uppercase tracking-[0.32em] text-gold-600">
          Certificate of Provenance
        </div>
        <div className="mt-2 font-display text-xl">St. Joseph at the Bench</div>
        <div className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          Egg tempera & gold leaf on poplar · 12 × 16 in.
        </div>
      </div>
      <hr className="my-3 border-t border-ink/15" />
      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <Row label="Artist">Sr. Maria Chrysostom</Row>
        <Row label="Patron">a household in Ohio</Row>
        <Row label="Begun">Septuagesima 2026</Row>
        <Row label="Delivered">Holy Saturday 2026</Row>
      </div>
      <hr className="my-3 border-t border-ink/15" />
      <div className="space-y-2 text-[11px] leading-snug">
        <div>
          <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted block mb-0.5">
            From the patron's letter
          </span>
          <em className="italic">
            "A working-man Joseph — sleeves rolled, plane in hand. For our
            second son, due Easter."
          </em>
        </div>
        <div>
          <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted block mb-0.5">
            The artist's vision
          </span>
          Joseph half-turned at his bench in the lower workshop light, the
          Child glimpsed asleep in shavings. Gold-leaf nimbus.
        </div>
      </div>
      <hr className="my-3 border-t border-ink/15" />
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display italic text-base">M. Chrysostom</div>
          <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
            in the year of our Lord MMXXVI
          </div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full border border-gold-500 text-gold-600 font-display text-xs">
          ✝
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
