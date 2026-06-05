// Mini mockup: the public ledger. Every commission, every dollar to
// the artist, every dollar the guild kept. Apprentice stipend fund
// shown when there's revenue.

export function MiniLedger() {
  return (
    <div className="p-5 sm:p-6">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
        Public ledger · 2026
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="To artists" value="$148,420" tone="ink" />
        <Stat label="Guild tithe" value="$2,968" tone="muted" />
        <Stat label="Apprentices" value="$1,484" tone="olive" />
      </div>
      <hr className="my-4 border-t border-ink/10" />
      <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted mb-2">
        Most recent
      </div>
      <ol className="space-y-1.5 font-sans text-[11px]">
        {[
          ["Sr. Maria Chrysostom", "$2,400", "St. Joseph panel"],
          ["Bro. Anselm", "$5,800", "Choir banner"],
          ["L. Romero", "$1,150", "Holy Family icon"],
        ].map(([who, amt, what], i) => (
          <li
            key={i}
            className="flex items-baseline justify-between border-b border-ink/5 py-1"
          >
            <span>
              <span className="font-display text-[12px] text-ink">{who}</span>
              <span className="ml-1.5 text-ink-muted">· {what}</span>
            </span>
            <span className="tabular-nums text-ink">{amt}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ink" | "muted" | "olive";
}) {
  const cls = {
    ink: "text-ink",
    muted: "text-ink-soft",
    olive: "text-olive-600",
  }[tone];
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-100/40 p-2.5">
      <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </div>
      <div className={`mt-0.5 font-display text-base tabular-nums ${cls}`}>
        {value}
      </div>
    </div>
  );
}
