import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  Mail,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { artistBySlug, isVerified } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { deriveTitle, formatPrice, initials } from "../lib/utils";
import { escrowReleasedUsd, escrowHeldUsd, escrowProgressPct } from "../lib/pricing";
import type {
  Commission,
  CommissionStage,
  ConnectAccount,
  Verification,
  VerificationStatus,
} from "../types";

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

const STAGE_COPY: Record<
  CommissionStage,
  { label: string; tone: "gold" | "olive" | "burgundy" | "lapis" | "outline" }
> = {
  scoping:           { label: "Awaiting quote",     tone: "gold" },
  "awaiting-deposit":{ label: "Awaiting deposit",   tone: "gold" },
  "in-progress":     { label: "In the studio",      tone: "lapis" },
  "midpoint-review": { label: "Midpoint · review",  tone: "gold" },
  "final-review":    { label: "Final · review",     tone: "gold" },
  delivered:         { label: "Delivered",          tone: "olive" },
  blessed:           { label: "Delivered · blessed",tone: "olive" },
  cancelled:         { label: "Cancelled",          tone: "burgundy" },
};

export default function Dashboard() {
  const { commissions, signedUpArtist, verifications, connectAccounts } = useStore();
  const [params] = useSearchParams();
  const justAppliedToken = params.get("just-applied");
  const [showCopyHint, setShowCopyHint] = useState<string | null>(null);

  const myVerification: Verification | null =
    verifications.find(
      (v) => v.token === signedUpArtist?.verificationToken,
    ) ??
    (justAppliedToken
      ? verifications.find((v) => v.token === justAppliedToken) ?? null
      : null);

  // Once a verifier is identified, look up their connect account to show payouts UI.
  const verifierArtistSlug = signedUpArtist?.name
    ? slugify(signedUpArtist.name)
    : undefined;
  const myConnect: ConnectAccount | null = verifierArtistSlug
    ? (connectAccounts[verifierArtistSlug] ?? null)
    : null;

  function copyLink(text: string, key: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setShowCopyHint(key);
    setTimeout(() => setShowCopyHint(null), 1500);
  }

  useEffect(() => {
    if (justAppliedToken) {
      setTimeout(() => {
        document
          .getElementById("verification-panel")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [justAppliedToken]);

  const inFlight = commissions.filter(
    (c) => c.stage !== "delivered" && c.stage !== "blessed" && c.stage !== "cancelled",
  );
  const completed = commissions.filter(
    (c) => c.stage === "delivered" || c.stage === "blessed",
  );

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
          Your applications, endorsements, payouts, and every commission in
          flight or completed.
        </p>
        <Ornament className="my-10" />
      </section>

      {/* Verification panel */}
      {myVerification && (
        <section
          id="verification-panel"
          className="container max-w-4xl mb-10"
        >
          <VerificationPanel
            verification={myVerification}
            onCopy={copyLink}
            copyHint={showCopyHint}
          />
        </section>
      )}

      {/* Connect / payouts panel — only if artist is endorsed */}
      {myVerification && isEndorsed(myVerification.status) && (
        <section className="container max-w-4xl mb-12">
          <PayoutsPanel
            artistName={signedUpArtist?.name ?? "Artist"}
            connect={myConnect}
            slug={verifierArtistSlug}
          />
        </section>
      )}

      {/* Welcome / artist applicant summary */}
      <section className="container max-w-5xl">
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

        <div className="flex items-baseline justify-between mb-5 gap-4 flex-wrap">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">
            Commissions in flight
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/browse">
              Commission an artist <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {inFlight.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4 mb-12">
            {inFlight.map((c) => (
              <CommissionTile key={c.id} commission={c} />
            ))}
          </ul>
        )}

        {completed.length > 0 && (
          <>
            <h2 className="font-display text-2xl sm:text-3xl text-ink mb-5 mt-8">
              Completed
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {completed.map((c) => (
                <CommissionTile key={c.id} commission={c} />
              ))}
            </ul>
          </>
        )}
      </section>
    </PageShell>
  );
}

// ───────── Commission tile ─────────
function CommissionTile({ commission }: { commission: Commission }) {
  const artist = artistBySlug(commission.artistSlug);
  const cat = categoryBySlug(commission.category);
  const stage = STAGE_COPY[commission.stage];
  const released = escrowReleasedUsd(commission.escrow);
  const held = escrowHeldUsd(commission.escrow);
  const total = commission.artistTotalUsd ?? 0;
  const pct = escrowProgressPct(commission.escrow);
  if (!artist) return null;
  return (
    <li>
      <Link
        to={`/workspace/${commission.id}`}
        className="block rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 hover:shadow-plate transition-shadow focusable"
      >
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 rounded-full grid place-items-center text-parchment-50 font-display text-base shrink-0"
            style={{
              background: `linear-gradient(135deg, ${artist.portraitFrom}, ${artist.portraitTo})`,
            }}
          >
            {initials(artist.name)}
          </div>
          <div className="grow min-w-0">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              {cat?.shortName} · with {artist.name.split(" ").slice(-1)[0]}
            </div>
            <div className="mt-0.5 font-display text-lg text-ink leading-tight line-clamp-2">
              {deriveTitle(commission.scope)}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant={stage.tone}>{stage.label}</Badge>
              {commission.preferredDeadline && (
                <Badge variant="outline">
                  Due{" "}
                  {new Date(commission.preferredDeadline).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {total > 0 && (
          <>
            <div className="mt-4 h-1 rounded-full bg-parchment-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-olive-500 to-olive-600"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between font-sans text-xs text-ink-muted">
              <span>
                <span className="tabular-nums">{formatPrice(released)}</span>{" "}
                released
                {held > 0 && (
                  <>
                    {" · "}
                    <span className="tabular-nums">{formatPrice(held)}</span>{" "}
                    held
                  </>
                )}
              </span>
              <span className="tabular-nums">{formatPrice(total)} total</span>
            </div>
          </>
        )}
      </Link>
    </li>
  );
}

// ───────── Empty ─────────
function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-ink/15 p-8 sm:p-12 text-center mb-12">
      <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-parchment-100 text-ink-muted">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-6 font-display text-2xl text-ink">
        No commissions yet.
      </h3>
      <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
        When you commission a guild artist, the workspace — escrow, studio
        thread, WIP gallery — lives here.
      </p>
      <Button asChild className="mt-6">
        <Link to="/browse">Browse the guild</Link>
      </Button>
    </div>
  );
}

// ───────── Payouts panel ─────────
function PayoutsPanel({
  artistName,
  connect,
  slug,
}: {
  artistName: string;
  connect: ConnectAccount | null;
  slug?: string;
}) {
  const verified = connect?.status === "verified";
  return (
    <div
      className={`rounded-md border ${verified ? "border-olive-500/30" : "border-ink/10"} bg-parchment-50 shadow-card p-5 sm:p-6`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${verified ? "bg-olive-500/15 text-olive-600" : "bg-burgundy-500/10 text-burgundy-500"}`}
          >
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
              Payouts
            </div>
            <h2 className="mt-1 font-display text-2xl text-ink leading-tight">
              {verified ? "You can receive payouts." : "Set up payouts"}
            </h2>
            {verified && connect ? (
              <p className="mt-1 font-serif text-sm text-ink-soft">
                Funds deposit to{" "}
                <strong>{connect.payoutAccountBank}</strong> ••••
                {connect.payoutAccountLast4} · tax form on file.
              </p>
            ) : (
              <p className="mt-1 font-serif text-sm text-ink-soft max-w-lg">
                You're endorsed and ready. Connect a bank account so we can
                pay you when patrons release each milestone. Onboarding takes
                under 5 minutes.
              </p>
            )}
          </div>
        </div>
        {!verified && slug && (
          <Button asChild>
            <Link to={`/connect/${slug}`}>
              {connect?.status === "onboarding"
                ? "Continue setup"
                : "Set up payouts"}{" "}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
        {verified && (
          <Badge variant="olive">
            <ShieldCheck className="h-3 w-3 mr-1" /> Stripe Connect verified
          </Badge>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-ink/10 grid grid-cols-3 gap-4 text-center">
        <KV label="Artist receives" value="100%" tone="olive" />
        <KV label="Guild tithe (at the end)" value="2%" tone="ink" />
        <KV label="Stripe fees" value="absorbed" tone="ink" />
      </div>
      <p className="mt-3 font-serif text-xs italic text-ink-muted leading-relaxed">
        Our promise: {artistName.split(" ")[0]}, you keep 100% of what you
        quote. The patron pays our fee on top.
      </p>
    </div>
  );
}

function KV({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "olive" | "ink";
}) {
  return (
    <div>
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl tabular-nums ${tone === "olive" ? "text-olive-600" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}

// ───────── Verification panel (unchanged shape from prior) ─────────
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

        <div className="mt-6 pt-6 border-t border-ink/10">
          {isEndorsed(verification.status) ? (
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

function isEndorsed(s: VerificationStatus) {
  return s === "endorsed" || s === "chancery-confirmed";
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Suppress dead-import lint while keeping helpful icons available
isVerified;
