import { Download } from "lucide-react";

// Mini mockup: artist's tax-ready earnings tab. Sums released
// milestones (artist's share, not the tithe) into a Schedule C–shaped
// CSV. The artist clicks once at January and has their year ready
// for the accountant.

const ROWS = [
  ["2026-02-14", "St. Joseph panel", "Final release", "$800"],
  ["2026-01-22", "Pietà icon (small)", "Midpoint", "$500"],
  ["2025-12-19", "Annunciation diptych", "Final release", "$1,200"],
  ["2025-11-08", "St. Cecilia choir banner", "Deposit", "$400"],
];

export function MiniEarnings() {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
            V. Earnings
          </div>
          <h3 className="font-display text-xl text-ink leading-tight">
            Tax-ready 2026
          </h3>
        </div>
        <button className="inline-flex items-center gap-1 rounded-sm border border-ink/15 bg-parchment-50 px-2 py-1 font-sans text-[10px] uppercase tracking-[0.18em] text-ink">
          <Download className="h-2.5 w-2.5" /> CSV
        </button>
      </div>
      <table className="w-full text-left font-sans text-[11px]">
        <thead className="text-[9px] uppercase tracking-[0.18em] text-ink-muted">
          <tr>
            <th className="pb-1.5 pr-2">Date</th>
            <th className="pb-1.5 pr-2">Commission</th>
            <th className="pb-1.5 pr-2">Stage</th>
            <th className="pb-1.5 text-right tabular-nums">Amount</th>
          </tr>
        </thead>
        <tbody className="text-ink-soft">
          {ROWS.map((r, i) => (
            <tr key={i} className="border-t border-ink/5">
              <td className="py-1.5 pr-2 tabular-nums text-ink-muted">{r[0]}</td>
              <td className="py-1.5 pr-2 text-ink">{r[1]}</td>
              <td className="py-1.5 pr-2 text-ink-muted">{r[2]}</td>
              <td className="py-1.5 text-right tabular-nums text-ink">{r[3]}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-ink/15">
            <td colSpan={3} className="py-2 font-display text-ink">
              YTD to your hand
            </td>
            <td className="py-2 text-right font-display text-ink tabular-nums">
              $2,900
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
