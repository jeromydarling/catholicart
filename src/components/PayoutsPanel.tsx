import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Globe, Loader2, Mail, Save, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { api } from "../lib/api";
import type { PayoutMethod, PayoutPreferenceShape } from "../lib/api";

// Artist-facing payout method picker. The artist picks one rail and
// fills in the fields specific to it. The release-final code uses
// these fields when it's time to pay them.

interface MethodOption {
  id: PayoutMethod;
  title: string;
  blurb: string;
  icon: typeof Banknote;
  fee: string;
}

const METHODS: MethodOption[] = [
  {
    id: "stripe_connect",
    title: "Stripe Connect",
    blurb:
      "Standard rail. Direct deposit to your bank in 100+ countries. Onboarding is a one-time flow on Stripe.",
    icon: Banknote,
    fee: "Stripe fees · ~0.25% + $0.25 per payout",
  },
  {
    id: "wise",
    title: "Wise (international transfer)",
    blurb:
      "Low-cost cross-border transfers to 70+ countries. We send to your local bank in your currency; no Wise account needed on your end.",
    icon: Globe,
    fee: "Wise mid-market rate + small transfer fee",
  },
  {
    id: "paper_check",
    title: "Paper check (mailed)",
    blurb:
      "We print and mail a check to the address you provide. US and Canada only. Arrives in 5–10 business days.",
    icon: Mail,
    fee: "Guild absorbs printing & postage",
  },
  {
    id: "paypal",
    title: "PayPal",
    blurb:
      "We send a payout to your PayPal email. Works in 200+ countries; PayPal account required on your end.",
    icon: Send,
    fee: "PayPal fees apply per their schedule",
  },
  {
    id: "manual_wire",
    title: "Manual wire (custom)",
    blurb:
      "For artists who require something the rails above don't cover — diocesan accounts, monastery treasuries, anything bespoke. We email instructions and arrange directly.",
    icon: Banknote,
    fee: "Outgoing wire fee from our bank",
  },
];

export function PayoutsPanel({ slug }: { slug: string }) {
  const [pref, setPref] = useState<PayoutPreferenceShape>({ method: "unset" });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.payoutPreference(slug);
      if (cancelled) return;
      if (res.ok) setPref(res.data.preference ?? { method: "unset" });
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function patch(p: Partial<PayoutPreferenceShape>) {
    setPref((cur) => ({ ...cur, ...p }));
    setSavedAt(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await api.savePayoutPreference(slug, pref);
    setSaving(false);
    if (!res.ok) {
      setError("Could not save — try again.");
      return;
    }
    setSavedAt(new Date().toLocaleTimeString());
    setPref(res.data.preference);
  }

  if (!loaded) {
    return (
      <div className="container py-10 text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
        Loading payout settings…
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-10 pb-16">
      <aside className="lg:col-span-4">
        <h3 className="font-display text-2xl text-ink">How we'll pay you</h3>
        <p className="mt-3 font-serif text-base text-ink-soft leading-relaxed">
          Pick the rail that fits your situation. You receive 100% of
          your quote — the 2% guild tithe is settled separately at the
          end of each commission and never comes out of your share.
        </p>
        <p className="mt-3 font-serif text-sm text-ink-muted leading-relaxed">
          You can change this at any time. The rail in effect when a
          final milestone releases is the one used for that
          disbursement.
        </p>
      </aside>

      <section className="lg:col-span-8 space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          {METHODS.map((m) => {
            const Icon = m.icon;
            const active = pref.method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => patch({ method: m.id })}
                className={`text-left rounded-md border p-4 transition-all focusable ${
                  active
                    ? "border-burgundy-500 bg-burgundy-500/5 shadow-card"
                    : "border-ink/10 bg-parchment-50 hover:border-burgundy-500/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-sm ${
                      active
                        ? "bg-burgundy-500 text-parchment-50"
                        : "bg-burgundy-500/10 text-burgundy-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="font-display text-base text-ink leading-tight grow">
                    {m.title}
                  </div>
                  {active && (
                    <CheckCircle2 className="h-4 w-4 text-burgundy-500" />
                  )}
                </div>
                <p className="mt-2 font-serif text-sm text-ink-soft leading-snug">
                  {m.blurb}
                </p>
                <div className="mt-2 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                  {m.fee}
                </div>
              </button>
            );
          })}
        </div>

        {pref.method === "wise" && <WiseFields pref={pref} patch={patch} />}
        {pref.method === "paper_check" && <CheckFields pref={pref} patch={patch} />}
        {pref.method === "paypal" && <PayPalFields pref={pref} patch={patch} />}
        {pref.method === "manual_wire" && (
          <ManualWireFields pref={pref} patch={patch} />
        )}
        {pref.method === "stripe_connect" && (
          <div className="rounded-md border border-ink/10 bg-parchment-100/50 p-4">
            <p className="font-serif text-sm text-ink-soft leading-relaxed">
              Stripe Connect onboarding hasn't been linked to your
              artist account yet. We'll open a Stripe-hosted flow on
              save — you finish the onboarding there and we receive
              the verified account ID. No bank details ever pass
              through our servers.
            </p>
          </div>
        )}

        {pref.method !== "unset" && (
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save payout settings
            </Button>
            {savedAt && (
              <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-olive-600">
                Saved · {savedAt}
              </span>
            )}
            {error && (
              <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-burgundy-500">
                {error}
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

type FieldsProps = {
  pref: PayoutPreferenceShape;
  patch: (p: Partial<PayoutPreferenceShape>) => void;
};

function WiseFields({ pref, patch }: FieldsProps) {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-100/40 p-5 space-y-4">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
        Wise · recipient details
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Account holder name (legal)">
          <Input
            value={pref.wise_account_holder_name ?? ""}
            onChange={(e) => patch({ wise_account_holder_name: e.target.value })}
            placeholder="Maria Chrysostom"
          />
        </Field>
        <Field label="Currency (3-letter ISO)">
          <Input
            value={pref.wise_currency ?? ""}
            onChange={(e) => patch({ wise_currency: e.target.value.toUpperCase() })}
            placeholder="EUR · GBP · USD · BRL"
            maxLength={3}
          />
        </Field>
        <Field label="Country (2-letter ISO)">
          <Input
            value={pref.wise_country ?? ""}
            onChange={(e) => patch({ wise_country: e.target.value.toUpperCase() })}
            placeholder="IT · US · BR"
            maxLength={2}
          />
        </Field>
        <Field label="IBAN (preferred where available)">
          <Input
            value={pref.wise_iban ?? ""}
            onChange={(e) => patch({ wise_iban: e.target.value })}
            placeholder="IT60X05428111…"
          />
        </Field>
        <Field label="Account number (if no IBAN)">
          <Input
            value={pref.wise_account_number ?? ""}
            onChange={(e) => patch({ wise_account_number: e.target.value })}
          />
        </Field>
        <Field label="Sort / routing / bank code">
          <Input
            value={pref.wise_bank_code ?? ""}
            onChange={(e) => patch({ wise_bank_code: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

function CheckFields({ pref, patch }: FieldsProps) {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-100/40 p-5 space-y-4">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
        Paper check · mailing address
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Payee name (as written on the check)">
          <Input
            value={pref.check_payee_name ?? ""}
            onChange={(e) => patch({ check_payee_name: e.target.value })}
            placeholder="Maria Chrysostom"
          />
        </Field>
        <Field label="Country">
          <Input
            value={pref.check_country ?? "US"}
            onChange={(e) => patch({ check_country: e.target.value.toUpperCase() })}
            placeholder="US · CA"
            maxLength={2}
          />
        </Field>
        <Field label="Address line 1" full>
          <Input
            value={pref.check_address_line1 ?? ""}
            onChange={(e) => patch({ check_address_line1: e.target.value })}
            placeholder="1234 Main St."
          />
        </Field>
        <Field label="Address line 2" full>
          <Input
            value={pref.check_address_line2 ?? ""}
            onChange={(e) => patch({ check_address_line2: e.target.value })}
            placeholder="Apt 2B"
          />
        </Field>
        <Field label="City">
          <Input
            value={pref.check_city ?? ""}
            onChange={(e) => patch({ check_city: e.target.value })}
          />
        </Field>
        <Field label="State / province">
          <Input
            value={pref.check_state ?? ""}
            onChange={(e) => patch({ check_state: e.target.value })}
          />
        </Field>
        <Field label="Postal code">
          <Input
            value={pref.check_postal_code ?? ""}
            onChange={(e) => patch({ check_postal_code: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

function PayPalFields({ pref, patch }: FieldsProps) {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-100/40 p-5 space-y-4">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
        PayPal · receiving email
      </div>
      <Field label="PayPal email">
        <Input
          type="email"
          value={pref.paypal_email ?? ""}
          onChange={(e) => patch({ paypal_email: e.target.value })}
          placeholder="you@example.com"
        />
      </Field>
    </div>
  );
}

function ManualWireFields({ pref, patch }: FieldsProps) {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-100/40 p-5 space-y-4">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
        Manual wire · arrangements
      </div>
      <Field label="Tell us how you'd like to be paid">
        <Textarea
          rows={5}
          value={pref.manual_wire_notes ?? ""}
          onChange={(e) => patch({ manual_wire_notes: e.target.value })}
          placeholder="E.g. SWIFT details to the abbey treasury, contact name and email, any compliance considerations…"
        />
      </Field>
      <p className="font-serif text-sm text-ink-muted">
        We'll reach out before each release to confirm details and
        send instructions.
      </p>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
