import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  FileText,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { artistBySlug } from "../data/artists";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";

// Mock Stripe Connect onboarding. Three steps:
//   1. Banking
//   2. Identity (auto-passes in prototype)
//   3. Tax form (W-9 / 1099 mock)

type Step = 1 | 2 | 3;

export default function Connect() {
  const { slug = "" } = useParams<{ slug: string }>();
  const store = useStore();
  const navigate = useNavigate();
  const artist = artistBySlug(slug);
  const existing = store.getConnect(slug);

  const [step, setStep] = useState<Step>(
    existing?.status === "verified" ? 3 : 1,
  );
  const [bank, setBank] = useState(existing?.payoutAccountBank ?? "");
  const [last4, setLast4] = useState(existing?.payoutAccountLast4 ?? "");
  const [completed, setCompleted] = useState(existing?.status === "verified");

  if (!artist) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl">Artist not found</h1>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/dashboard">Your dashboard</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  function startOnboarding() {
    if (!existing) store.startConnect(slug);
  }

  function completeBanking() {
    if (!bank.trim() || !/^\d{4}$/.test(last4)) return;
    store.completeConnect(slug, bank.trim(), last4);
    setStep(2);
  }

  function completeIdentity() {
    setStep(3);
  }

  function completeTax() {
    store.submitTaxForm(slug);
    setCompleted(true);
  }

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-3">
          <Link to="/dashboard" className="hover:text-burgundy-500">
            Dashboard
          </Link>{" "}
          ›{" "}
          <span>Set up payouts</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          Set up payouts
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl">
          Connect your bank so commissions can be paid directly to you.
          Onboarding is handled by Stripe; we never see your account
          information.
        </p>
        <Ornament className="my-8" />

        {/* Progress */}
        <ol className="grid grid-cols-3 gap-2 sm:gap-4 mb-10">
          <ProgressStep
            n={1}
            label="Banking"
            current={step}
            done={step > 1 || completed}
          />
          <ProgressStep
            n={2}
            label="Identity"
            current={step}
            done={step > 2 || completed}
          />
          <ProgressStep
            n={3}
            label="Tax form"
            current={step}
            done={completed}
          />
        </ol>

        <AnimatePresence mode="wait">
          {completed ? (
            <DoneCard
              key="done"
              onContinue={() => navigate("/dashboard")}
              bank={bank}
              last4={last4}
            />
          ) : step === 1 ? (
            <StepCard
              key="step-1"
              icon={<Banknote className="h-5 w-5" />}
              title="Bank account for payouts"
              note="Standard ACH transfer — funds arrive 2 business days after each milestone is released."
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bank">Bank name</Label>
                  <Input
                    id="bank"
                    value={bank}
                    onChange={(e) => {
                      setBank(e.target.value);
                      startOnboarding();
                    }}
                    placeholder="e.g. First National Bank"
                    autoComplete="off"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="routing">Routing number</Label>
                    <Input
                      id="routing"
                      placeholder="9 digits"
                      autoComplete="off"
                      inputMode="numeric"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="acct">Account number</Label>
                    <Input
                      id="acct"
                      placeholder="•••• ••••"
                      autoComplete="off"
                      inputMode="numeric"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        if (v.length >= 4) setLast4(v.slice(-4));
                      }}
                    />
                  </div>
                </div>
                <p className="font-serif text-xs italic text-ink-muted leading-relaxed flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Your account number is encrypted and tokenized by Stripe.
                  Only the last four digits are stored on Ars Sacra.
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!bank.trim() || !/^\d{4}$/.test(last4)}
                  onClick={completeBanking}
                >
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </StepCard>
          ) : step === 2 ? (
            <StepCard
              key="step-2"
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Identity verification"
              note="In production: a quick photo of your driver's license + selfie. Stripe handles verification."
            >
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Legal first name" placeholder="First" />
                  <Field label="Legal last name" placeholder="Last" />
                </div>
                <Field label="Date of birth" type="date" />
                <Field
                  label="Address (line 1)"
                  placeholder="Street address"
                  autoComplete="address-line1"
                />
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label="City" placeholder="City" />
                  <Field label="State" placeholder="State" />
                  <Field label="ZIP" placeholder="ZIP" inputMode="numeric" />
                </div>
                <p className="font-serif text-xs italic text-ink-muted leading-relaxed">
                  Skipped in the prototype. In production, Stripe Identity
                  performs document and biometric verification.
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  variant="ink"
                  onClick={completeIdentity}
                >
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </StepCard>
          ) : (
            <StepCard
              key="step-3"
              icon={<FileText className="h-5 w-5" />}
              title="Tax form"
              note="Required to issue an annual 1099. We'll prefill what we can."
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Filing as" placeholder="Sole proprietor" />
                  <Field label="TIN" placeholder="•••-••-••••" />
                </div>
                <p className="font-serif text-xs italic text-ink-muted leading-relaxed">
                  Skipped in the prototype. In production this submits a W-9
                  through Stripe Tax.
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  variant="gold"
                  onClick={completeTax}
                >
                  Submit & verify <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </StepCard>
          )}
        </AnimatePresence>
      </section>
    </PageShell>
  );
}

function ProgressStep({
  n,
  label,
  current,
  done,
}: {
  n: Step;
  label: string;
  current: Step;
  done: boolean;
}) {
  const active = current === n;
  return (
    <li
      className={cn(
        "rounded-md border px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-3",
        done
          ? "bg-olive-500/10 border-olive-500/30"
          : active
            ? "bg-parchment-50 border-burgundy-500/40 shadow-card"
            : "bg-parchment-100/40 border-ink/10",
      )}
    >
      <div
        className={cn(
          "h-7 w-7 rounded-full grid place-items-center font-display text-sm shrink-0",
          done
            ? "bg-olive-500 text-parchment-50"
            : active
              ? "bg-burgundy-500 text-parchment-50"
              : "bg-parchment-200 text-ink-muted",
        )}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
      </div>
      <div className="font-sans text-xs uppercase tracking-[0.18em] text-ink-soft truncate">
        {label}
      </div>
    </li>
  );
}

function StepCard({
  icon,
  title,
  note,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-6 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-burgundy-500/10 text-burgundy-500">
          {icon}
        </div>
        <div className="grow">
          <h2 className="font-display text-2xl text-ink leading-tight">
            {title}
          </h2>
          {note && (
            <p className="mt-1 font-serif text-sm text-ink-muted leading-relaxed">
              {note}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </motion.div>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
      />
    </div>
  );
}

function DoneCard({
  onContinue,
  bank,
  last4,
}: {
  onContinue: () => void;
  bank: string;
  last4: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-md border border-olive-500/30 bg-gradient-to-br from-parchment-50 to-olive-500/5 p-6 sm:p-8 text-center"
    >
      <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-olive-500 text-parchment-50">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h2 className="mt-6 font-display text-3xl text-ink">
        You can receive payouts.
      </h2>
      <p className="mt-2 font-serif text-base text-ink-muted max-w-md mx-auto">
        Funds will deposit to <strong className="text-ink">{bank}</strong>{" "}
        ••••{last4} two business days after each milestone is released.
      </p>
      <Badge variant="olive" className="mt-4">
        Stripe Connect verified
      </Badge>
      <div className="mt-8">
        <Button size="lg" onClick={onContinue}>
          Back to dashboard <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
