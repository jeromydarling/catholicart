import { ShieldCheck, Mail } from "lucide-react";

// Mini mockup: the pastor's one-click endorsement landing. They get an
// email, follow the signed-token link, and see this — three plain
// buttons. No account, no signup.

export function MiniEndorsement() {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-olive-500 text-parchment-50">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        <div>
          <div className="font-sans text-[9px] uppercase tracking-[0.22em] text-olive-600">
            One-click verification
          </div>
          <div className="font-display text-base text-ink leading-tight">
            Endorse Sr. Maria Chrysostom?
          </div>
        </div>
      </div>
      <p className="font-serif text-[12px] text-ink-soft leading-snug">
        The artist asks for your endorsement as her pastor. Choose one —
        no account required.
      </p>
      <div className="mt-4 space-y-2">
        <button className="w-full rounded-sm bg-olive-500 px-3 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-parchment-50">
          Yes — I endorse her
        </button>
        <button className="w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          I'd like to talk first
        </button>
        <button className="w-full rounded-sm border border-burgundy-500/20 bg-parchment-50 px-3 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-burgundy-500/80">
          Decline politely
        </button>
      </div>
      <div className="mt-4 flex items-center gap-1.5 font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
        <Mail className="h-2.5 w-2.5" /> Link expires in 30 days · signed token
      </div>
    </div>
  );
}
