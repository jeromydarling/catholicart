import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  Mail,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { artistBySlug } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { brand } from "../data/brand";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { formatPrice } from "../lib/utils";
import type { Verification, VerificationStatus } from "../types";

const STATUS_COPY: Record<
  VerificationStatus,
  { label: string; tone: "gold" | "olive" | "burgundy" | "outline" }
> = {
  pending: { label: "Awaiting endorsement", tone: "gold" },
  endorsed: { label: "Endorsed", tone: "olive" },
  "endorsed-chancery-pending": {
    label: "Endorsed · awaiting chancery",
    tone: "gold",
  },
  "chancery-confirmed": { label: "Endorsed · chancery confirmed", tone: "olive" },
  declined: { label: "Declined", tone: "burgundy" },
  discuss: { label: "Pending discussion", tone: "gold" },
  expired: { label: "Expired — re-confirm", tone: "burgundy" },
  revoked: { label: "Revoked", tone: "burgundy" },
};

export default function Dashboard() {
  const { requests, signedUpArtist, verifications } = useStore();
  const [params] = useSearchParams();
  const justAppliedToken = params.get("just-applied");
  const [showCopyHint, setShowCopyHint] = useState<string | null>(null);

  const myVerification =
    verifications.find(
      (v) => v.token === signedUpArtist?.verificationToken,
    ) ??
    (justAppliedToken
      ? verifications.find((v) => v.token === justAppliedToken) ?? null
      : null);

  // Copy-to-clipboard helper for the simulated magic-links.
  function copyLink(text: string, key: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setShowCopyHint(key);
    setTimeout(() => setShowCopyHint(null), 1500);
  }

  useEffect(() => {
    if (justAppliedToken) {
      // Scroll to the verification panel
      setTimeout(() => {
        document
          .getElementById("verification-panel")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [justAppliedToken]);

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Your dashboard
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          Your guild record
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl">
          Your application status, your pastor&rsquo;s endorsement, and a
          register of any commissions you have requested.
        </p>
        <Ornament className="my-10" />
      </section>

      {/* Verification panel — only when artist has applied */}
      {myVerification && (
        <section
          id="verification-panel"
          className="container max-w-4xl mb-16"
        >
          <VerificationPanel
            verification={myVerification}
            onCopy={copyLink}
            copyHint={showCopyHint}
          />
        </section>
      )}

      {/* Welcome / artist applicant summary */}
      <section className="container max-w-4xl">
        {signedUpArtist && !myVerification && (
          <div className="mb-10 rounded-md border border-ink/10 bg-burgundy-500/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-burgundy-500 text-parchment-50">
                <span className="font-display text-base">
                  {signedUpArtist.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-display text-xl text-ink">
                  Welcome, {signedUpArtist.name.split(" ")[0]}.
                </div>
                <p className="mt-1 font-serif text-sm text-ink-soft">
                  Your application is under review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Commission requests register */}
        <h2 className="font-display text-2xl sm:text-3xl text-ink mb-5">
          Commissions you&rsquo;ve requested
        </h2>
        {requests.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink/15 p-8 sm:p-12 text-center">
            <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-parchment-100 text-ink-muted">
              <Inbox className="h-5 w-5" />
            </div>
            <h3 className="mt-6 font-display text-2xl text-ink">
              No commissions yet.
            </h3>
            <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
              When you request work from a guild artist, the conversation
              will be kept here.
            </p>
            <Button asChild className="mt-6">
              <Link to="/browse">Browse the guild</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {requests.map((r) => {
              const artist = artistBySlug(r.artistSlug);
              const cat = categoryBySlug(r.category);
              if (!artist) return null;
              return (
                <li
                  key={r.id}
                  className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                        Commission · {cat?.name}
                      </div>
                      <div className="mt-1 font-display text-2xl text-ink">
                        <Link
                          to={`/artists/${artist.slug}`}
                          className="hover:text-burgundy-500"
                        >
                          {artist.honorific ? `${artist.honorific} ` : ""}
                          {artist.name}
                        </Link>
                      </div>
                      <div className="mt-1 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
                        From {r.fromName} · sent{" "}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="gold">Sent</Badge>
                      <Badge variant="outline">{r.setting}</Badge>
                      {r.budgetUsd ? (
                        <Badge variant="burgundy">
                          Budget {formatPrice(r.budgetUsd)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-4 font-serif text-base text-ink-soft leading-relaxed line-clamp-4 whitespace-pre-line">
                    {r.description}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

function VerificationPanel({
  verification,
  onCopy,
  copyHint,
}: {
  verification: Verification;
  onCopy: (text: string, key: string) => void;
  copyHint: string | null;
}) {
  const status = STATUS_COPY[verification.status];
  const verifyUrl = `${window.location.origin}${import.meta.env.BASE_URL}verify/${verification.token}`;
  const chanceryUrl = verification.chanceryToken
    ? `${window.location.origin}${import.meta.env.BASE_URL}chancery/${verification.chanceryToken}`
    : null;

  const priestActed =
    verification.status === "endorsed" ||
    verification.status === "endorsed-chancery-pending" ||
    verification.status === "chancery-confirmed" ||
    verification.status === "declined" ||
    verification.status === "discuss";
  const chanceryActed = verification.status === "chancery-confirmed";

  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden">
      <div className="p-5 sm:p-7 border-b border-ink/10 bg-parchment-100/60">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-1.5">
              Endorsement
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
              {verification.parishOrCommunity}
            </h2>
            <p className="mt-1 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
              {verification.verifierName}
            </p>
          </div>
          <Badge variant={status.tone}>{status.label}</Badge>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {/* Step 1: priest */}
        <Step
          n={1}
          title={`${verification.role === "religious-superior" ? "Superior" : verification.role === "chancery" ? "Chancery" : "Pastor"}'s endorsement`}
          state={
            verification.status === "declined"
              ? "declined"
              : priestActed
                ? "done"
                : "pending"
          }
          icon={
            verification.status === "declined"
              ? XCircle
              : priestActed
                ? CheckCircle2
                : Clock
          }
        >
          <div className="font-serif text-sm text-ink-soft leading-relaxed">
            We sent a one-click endorsement page to{" "}
            <strong className="font-medium">{verification.verifierName}</strong>{" "}
            at{" "}
            <code className="font-mono text-xs bg-parchment-100 px-1.5 py-0.5 rounded">
              {verification.verifierEmail}
            </code>
            .
          </div>

          {!priestActed && (
            <div className="mt-3 rounded-md border border-dashed border-burgundy-500/30 bg-burgundy-500/5 p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-burgundy-500 shrink-0 mt-0.5" />
                <div className="grow">
                  <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-burgundy-500 mb-1">
                    Prototype simulation
                  </div>
                  <p className="font-serif text-sm text-ink-soft leading-relaxed">
                    No real email is sent in the prototype. Click below to
                    open the endorsement page as your verifier would see it.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button asChild size="sm">
                      <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open endorsement page{" "}
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopy(verifyUrl, "verify")}
                    >
                      {copyHint === "verify" ? "Copied ✓" : "Copy link"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {priestActed && (
            <div className="mt-3 font-serif text-sm text-ink-soft">
              {verification.status === "declined" ? (
                <>The verifier did not endorse the application.</>
              ) : verification.status === "discuss" ? (
                <>
                  The verifier requested a conversation before deciding. A
                  guild reader will follow up.
                </>
              ) : (
                <>
                  Endorsed{" "}
                  {verification.endorsedAt &&
                    `on ${new Date(verification.endorsedAt).toLocaleDateString()}`}
                  .
                </>
              )}
            </div>
          )}
        </Step>

        {/* Step 2: chancery (only if free webmail) */}
        {verification.verifierEmailIsFreeWebmail && chanceryUrl && (
          <Step
            n={2}
            title="Chancery confirmation"
            state={
              chanceryActed
                ? "done"
                : verification.status === "endorsed-chancery-pending"
                  ? "pending"
                  : verification.status === "declined"
                    ? "declined"
                    : "queued"
            }
            icon={
              chanceryActed
                ? CheckCircle2
                : verification.status === "declined"
                  ? XCircle
                  : Clock
            }
          >
            <div className="font-serif text-sm text-ink-soft leading-relaxed">
              Because the verifier&rsquo;s email is on a free-webmail
              provider, we also confirm with the diocesan chancery before
              the endorsement counts as full.
            </div>
            {(verification.status === "endorsed-chancery-pending" ||
              verification.status === "pending") && (
              <div className="mt-3 rounded-md border border-dashed border-gold-500/40 bg-gold-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-gold-600 shrink-0 mt-0.5" />
                  <div className="grow">
                    <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-gold-600 mb-1">
                      Prototype simulation
                    </div>
                    <p className="font-serif text-sm text-ink-soft leading-relaxed">
                      Chancery contacted at{" "}
                      <code className="font-mono text-xs bg-parchment-100 px-1.5 py-0.5 rounded">
                        {verification.chanceryEmail ?? "(no chancery email)"}
                      </code>
                      . Open the chancery page as the chancellor would see it.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="gold">
                        <a
                          href={chanceryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open chancery page{" "}
                          <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCopy(chanceryUrl, "chancery")}
                      >
                        {copyHint === "chancery" ? "Copied ✓" : "Copy link"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {chanceryActed && verification.chanceryConfirmedAt && (
              <div className="mt-3 font-serif text-sm text-ink-soft">
                Confirmed on{" "}
                {new Date(verification.chanceryConfirmedAt).toLocaleDateString()}
                .
              </div>
            )}
          </Step>
        )}

        {/* Final state */}
        <div className="mt-6 pt-6 border-t border-ink/10">
          {verification.status === "endorsed" ||
          verification.status === "chancery-confirmed" ? (
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-olive-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-display text-lg text-ink">
                  Your profile will go live on the guild.
                </div>
                <p className="mt-1 font-serif text-sm text-ink-muted">
                  Re-confirmation in 12 months. Your verifier may revoke at
                  any time.
                </p>
              </div>
            </div>
          ) : verification.status === "declined" ? (
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-burgundy-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-display text-lg text-ink">
                  Application declined.
                </div>
                <p className="mt-1 font-serif text-sm text-ink-muted">
                  If you believe there&rsquo;s been a misunderstanding, you
                  may re-apply with a different verifier.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gold-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-display text-lg text-ink">
                  Awaiting endorsement.
                </div>
                <p className="mt-1 font-serif text-sm text-ink-muted">
                  We&rsquo;ll email you the moment your verifier responds.
                  Most respond within a week.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  state,
  icon: Icon,
  children,
}: {
  n: number;
  title: string;
  state: "queued" | "pending" | "done" | "declined";
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const tone =
    state === "done"
      ? "bg-olive-500 text-parchment-50"
      : state === "declined"
        ? "bg-burgundy-500 text-parchment-50"
        : state === "pending"
          ? "bg-gold-500 text-parchment-50"
          : "bg-parchment-200 text-ink-soft";
  return (
    <div className="flex gap-4 py-2">
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="grow pb-3">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
            Step {n}
          </span>
        </div>
        <div className="font-display text-lg text-ink leading-tight">
          {title}
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
