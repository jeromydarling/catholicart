import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";

export default function Security() {
  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Security & risk
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          The runbook.
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl leading-relaxed">
          We handle money, identity, and religious trust. We treat the risks
          seriously and we write the response procedures down so that on the
          worst day we don't improvise.
        </p>
        <Ornament className="my-10" />

        <div className="space-y-10">
          <Block icon={<AlertTriangle className="h-5 w-5" />} title="Chargebacks">
            <Step>
              <strong>Detect.</strong> Stripe webhook (
              <code className="font-mono text-xs">charge.dispute.created</code>)
              fires a Supabase edge function that opens an internal Dispute
              record + freezes future payouts to the artist's Connect
              account.
            </Step>
            <Step>
              <strong>Investigate.</strong> A guild operator opens the
              workspace, reviews the studio thread, WIP, blessing record,
              and patron's signed certificate. The Ledger is the evidence.
            </Step>
            <Step>
              <strong>Respond.</strong> If we have a delivered, blessed
              commission with patron acknowledgment, we contest the
              chargeback through Stripe with that evidence package. If the
              patron has cause, we side with the patron and absorb the
              loss against our platform reserve.
            </Step>
            <Step>
              <strong>Recover.</strong> Repeated chargebacks from one
              patron auto-flag the account. From one artist, auto-suspend
              and review.
            </Step>
          </Block>

          <Block icon={<ShieldCheck className="h-5 w-5" />} title="Content moderation">
            <Step>
              Anyone can flag a commission from the workspace. Operators
              see flags in the admin console.
            </Step>
            <Step>
              Flagged commissions stay visible to the parties but are
              suppressed from public surfaces (Ledger, Catalog, Browse)
              until cleared.
            </Step>
            <Step>
              We refuse AI-generated work and demonstrably kitsch
              submissions (see the Anti-Kitsch Report). Repeat offenders
              are suspended.
            </Step>
          </Block>

          <Block icon={<Mail className="h-5 w-5" />} title="Pastor email impersonation">
            <Step>
              <strong>Default protection:</strong> the endorsement link is
              a single-use signed token. Even if intercepted in transit,
              the endorsement record requires the verifier to act from
              their own email's inbox.
            </Step>
            <Step>
              <strong>Free-webmail provider:</strong> when the verifier's
              email is on Gmail/Outlook/etc., we additionally require
              confirmation from the diocesan chancery. This is the
              second factor.
            </Step>
            <Step>
              <strong>2FA upgrade:</strong> Q3 — every endorsement link
              also emails a 6-digit code, separately, that the verifier
              enters before signing off.
            </Step>
          </Block>

          <Block icon={<Lock className="h-5 w-5" />} title="Database breach response">
            <Step>
              <strong>0–1 hour:</strong> rotate Supabase service-role
              keys, all Stripe API keys, Resend keys. Snapshot
              production DB. Engage Stripe and Supabase support.
            </Step>
            <Step>
              <strong>1–24 hours:</strong> determine scope of breach. Pull
              audit logs. Identify affected accounts. Draft user
              notification.
            </Step>
            <Step>
              <strong>24–72 hours:</strong> notify affected users by
              email and direct dashboard banner. Notify the relevant
              regulator (GDPR / CCPA) if PII was exposed. Publish a
              postmortem to /security/incidents.
            </Step>
            <Step>
              <strong>Recurring drill:</strong> we tabletop this
              quarterly. Two senior engineers always on call.
            </Step>
          </Block>

          <Block icon={<AlertTriangle className="h-5 w-5" />} title="Velocity & laundering">
            <Step>
              Any patron commissioning more than $25,000/month is auto-
              flagged for a verification call. Any patron who
              cumulatively commissions more than $100,000 in a quarter
              is escalated to compliance review.
            </Step>
            <Step>
              Stripe's Radar handles the front line; our platform adds
              the second-line check using the patron's history and the
              artist's history together.
            </Step>
          </Block>
        </div>

        <Ornament className="my-12" />

        <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ink">Disclose responsibly.</h2>
          <p className="mt-2 font-serif text-base text-ink-muted leading-relaxed">
            Found a vulnerability? We want to know first. Write to{" "}
            <strong className="text-ink">security@arssacra.com</strong> with
            steps to reproduce. We acknowledge within 48 hours and credit you
            in the disclosure log.
          </p>
          <Button asChild className="mt-4">
            <a href="mailto:security@arssacra.com">
              <Mail className="h-4 w-4 mr-2" /> security@arssacra.com
            </a>
          </Button>
        </div>
      </section>

      <section className="container my-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "Be wise as serpents and innocent as doves." — Mt 10:16
        </p>
      </section>
    </PageShell>
  );
}

function Block({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-burgundy-500/10 text-burgundy-500">
          {icon}
        </div>
        <h2 className="font-display text-2xl text-ink leading-tight">{title}</h2>
      </div>
      <ol className="space-y-3 pl-13 border-l-2 border-ink/10 pl-6">{children}</ol>
    </div>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <li className="font-serif text-base text-ink-soft leading-relaxed">
      <ArrowRight className="inline h-3.5 w-3.5 mr-2 text-gold-600" />
      {children}
    </li>
  );
}
