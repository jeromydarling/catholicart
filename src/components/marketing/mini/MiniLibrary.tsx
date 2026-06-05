import { Search } from "lucide-react";

// Mini mockup: the /library page — search for a saint or feast and
// see when it falls, who's patron of what. Used by artists planning
// commissions and by patrons writing letters.

const FEASTS = [
  { name: "Annunciation", date: "Mar 25", kind: "solemnity" },
  { name: "St. Joseph the Worker", date: "May 1", kind: "memorial" },
  { name: "Visitation", date: "May 31", kind: "feast" },
  { name: "Corpus Christi", date: "Jun 7", kind: "solemnity" },
];

export function MiniLibrary() {
  return (
    <div className="p-5 sm:p-6">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
        The library
      </div>
      <h3 className="font-display text-xl text-ink leading-tight">
        A small reference.
      </h3>
      <div className="mt-4 relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
        <input
          readOnly
          value="Joseph"
          className="w-full rounded-sm border border-ink/15 bg-parchment-50 pl-8 pr-2 py-2 font-sans text-[11px] text-ink"
        />
      </div>
      <div className="mt-4">
        <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-gold-600 mb-1.5">
          Upcoming feasts
        </div>
        <ol className="space-y-1">
          {FEASTS.map((f) => (
            <li
              key={f.name}
              className="flex items-baseline justify-between gap-2 py-1 border-b border-ink/5"
            >
              <span className="font-display text-[13px] text-ink">{f.name}</span>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-ink-muted tabular-nums">
                {f.date}
                {f.kind === "solemnity" && (
                  <span className="ml-1.5 text-gold-600">solemnity</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
