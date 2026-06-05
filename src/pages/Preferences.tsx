import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getPreferences, setPreferences } from "../lib/email/notify";
import type { EmailPreferences } from "../lib/email/types";

// /preferences?email=foo@bar — public unsubscribe + category toggles.
// In production a signed link from the email footer lands here.
export default function Preferences() {
  const [params] = useSearchParams();
  const queryEmail = params.get("email") ?? "";
  const [email, setEmail] = useState(queryEmail);
  const [loaded, setLoaded] = useState<EmailPreferences | null>(
    queryEmail ? getPreferences(queryEmail) : null,
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (queryEmail) setLoaded(getPreferences(queryEmail));
  }, [queryEmail]);

  function save(next: EmailPreferences) {
    setPreferences(next);
    setLoaded({ ...next, updatedAt: new Date().toISOString() });
    setSavedAt(new Date().toISOString());
    setTimeout(() => setSavedAt(null), 2500);
  }

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-2xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Email preferences
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          What you'd like us to send.
        </h1>
        <p className="mt-4 font-serif text-base text-ink-muted max-w-xl">
          Transactional emails (payment receipts, endorsement requests,
          dispute notices) cannot be turned off — they're how the platform
          works. Everything else is your choice.
        </p>
        <Ornament className="my-8" />

        {!loaded ? (
          <div className="rounded-md border border-ink/10 bg-parchment-50 p-6 space-y-4">
            <Label htmlFor="prefs-email" className="block space-y-1.5">
              <span className="block">Your email address</span>
              <Input
                id="prefs-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@parish.org"
              />
            </Label>
            <Button
              onClick={() => {
                if (!email.trim()) return;
                setLoaded(getPreferences(email.trim()));
              }}
            >
              Manage preferences
            </Button>
          </div>
        ) : (
          <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-6 sm:p-7">
            <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted">
              <Mail className="inline h-3 w-3 mr-1.5" /> Managing
            </div>
            <div className="mt-1 font-display text-xl text-ink">
              {loaded.email}
            </div>

            <ul className="mt-6 space-y-4">
              <Toggle
                label="Milestone updates"
                blurb="Quotes, midpoint reviews, studio updates, blessing notices for commissions you're a party to."
                checked={loaded.milestone && !loaded.unsubscribeAll}
                disabled={loaded.unsubscribeAll}
                onChange={(v) => save({ ...loaded, milestone: v })}
              />
              <Toggle
                label="Weekly digest"
                blurb="A Sunday summary if your commissions had activity that week. Easier on the inbox than per-event milestone emails."
                checked={loaded.digest && !loaded.unsubscribeAll}
                disabled={loaded.unsubscribeAll}
                onChange={(v) => save({ ...loaded, digest: v })}
              />
              <Toggle
                label="Marketing"
                blurb="New Beauty Manifesto issues, Pulchritudo Prize announcements, the occasional invitation. Quarterly at most."
                checked={loaded.marketing && !loaded.unsubscribeAll}
                disabled={loaded.unsubscribeAll}
                onChange={(v) => save({ ...loaded, marketing: v })}
              />
            </ul>

            <div className="mt-8 pt-6 border-t border-ink/10">
              <Toggle
                label="Unsubscribe from everything"
                blurb="You'll still receive the transactional emails the platform needs to function (payment receipts, dispute notices). Nothing else."
                checked={loaded.unsubscribeAll}
                onChange={(v) => save({ ...loaded, unsubscribeAll: v })}
                emphasis
              />
            </div>

            {savedAt && (
              <div className="mt-4 inline-flex items-center font-sans text-xs uppercase tracking-[0.18em] text-olive-600">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Saved
              </div>
            )}

            <p className="mt-8 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              Prototype · preferences are local to your browser
            </p>

            <div className="mt-6">
              <Button asChild variant="outline" size="sm">
                <Link to="/">Back to Locavit</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function Toggle({
  label,
  blurb,
  checked,
  disabled,
  onChange,
  emphasis,
}: {
  label: string;
  blurb: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  emphasis?: boolean;
}) {
  return (
    <li>
      <label className="flex items-start gap-4 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-ink/30 text-burgundy-500 focusable disabled:opacity-50"
        />
        <span className="grow">
          <span
            className={
              emphasis
                ? "block font-display text-base text-burgundy-500"
                : "block font-display text-base text-ink"
            }
          >
            {label}
          </span>
          <span className="block mt-1 font-serif text-sm text-ink-muted leading-relaxed">
            {blurb}
          </span>
        </span>
      </label>
    </li>
  );
}
