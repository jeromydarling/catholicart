import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  ArrowRight,
  Banknote,
  Eye,
  FlagOff,
  Flag,
  GraduationCap,
  Mail,
  Pause,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { artists, artistBySlug } from "../data/artists";
import { useStore } from "../lib/store";
import {
  escrowHeldUsd,
  escrowReleasedUsd,
} from "../lib/pricing";
import { deriveTitle, formatPrice, initials } from "../lib/utils";
import type { FlagReason } from "../types";

const FLAG_REASONS: { id: FlagReason; label: string }[] = [
  { id: "ai-generated", label: "Suspected AI-generated" },
  { id: "inappropriate", label: "Inappropriate / off-doctrine" },
  { id: "fraud", label: "Suspected fraud / laundering" },
  { id: "quality", label: "Below guild quality bar" },
  { id: "other", label: "Other" },
];

export default function Admin() {
  const store = useStore();
  const {
    commissions,
    disputes,
    commissionFlags,
    artistSuspensions,
    apprenticeships,
  } = store;

  const [tab, setTab] = useState<
    "overview" | "commissions" | "disputes" | "artists" | "apprenticeships"
  >("overview");

  const heldTotal = useMemo(
    () => commissions.reduce((s, c) => s + escrowHeldUsd(c.escrow), 0),
    [commissions],
  );
  const releasedTotal = useMemo(
    () => commissions.reduce((s, c) => s + escrowReleasedUsd(c.escrow), 0),
    [commissions],
  );
  const openDisputes = disputes.filter((d) => d.status === "open");
  const activeSuspensions = artistSuspensions.filter((s) => !s.liftedAt);

  return (
    <PageShell>
      <section className="container pt-10 sm:pt-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-3">
          Operator console
        </div>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
            Admin
          </h1>
          <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            Prototype · in production this is gated to staff with operator role
          </div>
        </div>
        <Ornament className="my-6" />
      </section>

      {/* At-a-glance */}
      <section className="container mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Tile label="Commissions" value={commissions.length.toString()} />
          <Tile label="In escrow now" value={formatPrice(heldTotal)} tone="burgundy" />
          <Tile label="Paid out total" value={formatPrice(releasedTotal)} tone="olive" />
          <Tile
            label="Open disputes"
            value={openDisputes.length.toString()}
            tone={openDisputes.length > 0 ? "burgundy" : undefined}
          />
          <Tile
            label="Suspended artists"
            value={activeSuspensions.length.toString()}
            tone={activeSuspensions.length > 0 ? "burgundy" : undefined}
          />
        </div>
      </section>

      <section className="container mb-10 flex items-center gap-2 flex-wrap">
        {([
          ["overview", "Overview"],
          ["commissions", `Commissions (${commissions.length})`],
          ["disputes", `Disputes (${openDisputes.length})`],
          ["artists", `Artists (${artists.length})`],
          ["apprenticeships", `Apprenticeships (${apprenticeships.length})`],
        ] as const).map(([id, label]) => (
          <TabPill key={id} active={tab === id} onClick={() => setTab(id)}>
            {label}
          </TabPill>
        ))}
      </section>

      <section className="container pb-20">
        {tab === "overview" && (
          <div className="space-y-8">
            <Panel title="What needs attention" icon={<AlertTriangle className="h-4 w-4" />}>
              <ul className="space-y-2">
                <AttentionRow ok={openDisputes.length === 0}>
                  {openDisputes.length === 0
                    ? "No open disputes."
                    : `${openDisputes.length} open dispute${openDisputes.length === 1 ? "" : "s"} need a mediator.`}
                </AttentionRow>
                <AttentionRow ok={commissionFlags.length === 0}>
                  {commissionFlags.length === 0
                    ? "No flagged commissions."
                    : `${commissionFlags.length} flagged commission${commissionFlags.length === 1 ? "" : "s"} to review.`}
                </AttentionRow>
                <AttentionRow ok={activeSuspensions.length === 0}>
                  {activeSuspensions.length === 0
                    ? "No artists are suspended."
                    : `${activeSuspensions.length} artist${activeSuspensions.length === 1 ? "" : "s"} suspended.`}
                </AttentionRow>
                <AttentionRow ok={apprenticeships.filter((a) => a.status === "submitted").length === 0}>
                  {apprenticeships.filter((a) => a.status === "submitted").length === 0
                    ? "No unreviewed apprenticeship applications."
                    : `${apprenticeships.filter((a) => a.status === "submitted").length} apprenticeship application${apprenticeships.filter((a) => a.status === "submitted").length === 1 ? "" : "s"} unreviewed.`}
                </AttentionRow>
              </ul>
            </Panel>

            <Panel title="Risk briefings" icon={<ShieldCheck className="h-4 w-4" />}>
              <ul className="grid sm:grid-cols-2 gap-3 text-sm font-serif text-ink-soft leading-relaxed">
                <li><strong className="text-ink">Chargeback policy:</strong> any released milestone that gets charged back triggers a freeze on the artist account and a dispute. Mediator decides liability.</li>
                <li><strong className="text-ink">Content moderation:</strong> flag suspected AI slop or theologically problematic requests; flagged items hide from public browse until cleared.</li>
                <li><strong className="text-ink">Velocity guard:</strong> a patron commissioning more than $25k/month is auto-flagged for verification.</li>
                <li><strong className="text-ink">Pastor 2FA:</strong> when a verifier opens the endorsement link we will require a 6-digit code emailed separately. (Prototype skips this.)</li>
              </ul>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link to="/security">
                    Read the breach-response runbook
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Panel>
          </div>
        )}

        {tab === "commissions" && (
          <CommissionsTab />
        )}

        {tab === "disputes" && (
          <DisputesTab />
        )}

        {tab === "artists" && (
          <ArtistsTab />
        )}

        {tab === "apprenticeships" && (
          <ApprenticeshipsTab />
        )}
      </section>
    </PageShell>
  );
}

// ───────────────────────── Tabs ─────────────────────────

function CommissionsTab() {
  const store = useStore();
  const { commissions, commissionFlags } = store;
  const [flagging, setFlagging] = useState<string | null>(null);
  const [reason, setReason] = useState<FlagReason>("ai-generated");
  const [note, setNote] = useState("");

  return (
    <ul className="space-y-3">
      {commissions.map((c) => {
        const flag = commissionFlags.find((f) => f.commissionId === c.id);
        const artist = artistBySlug(c.artistSlug);
        return (
          <li
            key={c.id}
            className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-1">
                  {c.stage}
                  {flag && (
                    <span className="ml-2 text-burgundy-500">
                      <Flag className="inline h-3 w-3 mr-1" />
                      flagged · {flag.reason}
                    </span>
                  )}
                </div>
                <Link to={`/workspace/${c.id}`} className="font-display text-lg text-ink hover:text-burgundy-500">
                  {deriveTitle(c.scope, 80)}
                </Link>
                <div className="mt-1 font-sans text-xs text-ink-muted">
                  {artist?.name} · {c.patronName} ·{" "}
                  {c.artistTotalUsd ? formatPrice(c.artistTotalUsd) : "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {flag ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => store.clearCommissionFlag(c.id)}
                  >
                    <FlagOff className="h-3.5 w-3.5 mr-2" /> Clear flag
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFlagging(c.id);
                      setReason("ai-generated");
                      setNote("");
                    }}
                  >
                    <Flag className="h-3.5 w-3.5 mr-2" /> Flag
                  </Button>
                )}
                <Button asChild size="sm" variant="link">
                  <Link to={`/workspace/${c.id}`}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Open
                  </Link>
                </Button>
              </div>
            </div>

            {flagging === c.id && (
              <div className="mt-4 pt-4 border-t border-ink/10 space-y-3">
                <Label className="block space-y-1.5">
                  <span className="block">Reason</span>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as FlagReason)}
                    className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
                  >
                    {FLAG_REASONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label className="block space-y-1.5">
                  <span className="block">Note (optional)</span>
                  <Textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      store.flagCommission({
                        commissionId: c.id,
                        reason,
                        note: note.trim() || undefined,
                      });
                      setFlagging(null);
                    }}
                  >
                    <Flag className="h-3.5 w-3.5 mr-2" /> Flag commission
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setFlagging(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DisputesTab() {
  const store = useStore();
  const { disputes, commissions } = store;
  if (disputes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink/15 p-12 text-center">
        <p className="font-serif text-ink-muted">No disputes on file.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {disputes.map((d) => {
        const c = commissions.find((x) => x.id === d.commissionId);
        return (
          <li
            key={d.id}
            className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-1">
                  {d.status} · opened by {d.openedBy} ·{" "}
                  {new Date(d.openedAt).toLocaleDateString()}
                </div>
                {c && (
                  <Link to={`/workspace/${c.id}`} className="font-display text-lg text-ink hover:text-burgundy-500">
                    {deriveTitle(c.scope, 80)}
                  </Link>
                )}
                <p className="mt-1 font-serif text-sm text-ink-soft italic">
                  "{d.reason}"
                </p>
              </div>
              {d.status === "open" && (
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() =>
                      store.resolveDispute(d.id, "resolved-mediated", "Mediator brokered an agreement between both parties.")
                    }
                  >
                    Resolve · mediated
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      store.resolveDispute(d.id, "resolved-refund", "Refund issued to patron.")
                    }
                  >
                    <Undo2 className="h-3.5 w-3.5 mr-2" /> Refund patron
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      store.resolveDispute(d.id, "resolved-release", "Release held funds to artist.")
                    }
                  >
                    <Banknote className="h-3.5 w-3.5 mr-2" /> Release to artist
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ArtistsTab() {
  const store = useStore();
  const [suspending, setSuspending] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  return (
    <ul className="space-y-3">
      {artists.map((a) => {
        const suspended = store.isArtistSuspended(a.slug);
        return (
          <li
            key={a.slug}
            className={
              "rounded-md border bg-parchment-50 shadow-card p-4 sm:p-5 " +
              (suspended ? "border-burgundy-500/40 bg-burgundy-500/5" : "border-ink/10")
            }
          >
            <div className="flex items-start gap-4 flex-wrap">
              <div
                className="h-12 w-12 rounded-full grid place-items-center text-parchment-50 font-display text-base shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${a.portraitFrom}, ${a.portraitTo})`,
                }}
              >
                {initials(a.name)}
              </div>
              <div className="grow min-w-0">
                <Link to={`/artists/${a.slug}`} className="font-display text-lg text-ink hover:text-burgundy-500">
                  {a.honorific ? `${a.honorific} ` : ""}
                  {a.name}
                </Link>
                <div className="mt-0.5 font-sans text-xs text-ink-muted">
                  {a.city} · {formatPrice(a.startingAt)} starting
                </div>
                {suspended && (
                  <Badge variant="burgundy" className="mt-2">
                    Suspended
                  </Badge>
                )}
              </div>
              <div className="shrink-0">
                {suspended ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => store.liftArtistSuspension(a.slug)}
                  >
                    Lift suspension
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSuspending(a.slug);
                      setReason("");
                    }}
                  >
                    <Pause className="h-3.5 w-3.5 mr-2" /> Suspend
                  </Button>
                )}
              </div>
            </div>
            {suspending === a.slug && (
              <div className="mt-4 pt-4 border-t border-ink/10 space-y-3">
                <Label className="block space-y-1.5">
                  <span className="block">Reason</span>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this artist being suspended?"
                  />
                </Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!reason.trim()}
                    onClick={() => {
                      store.suspendArtist(a.slug, reason.trim());
                      setSuspending(null);
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-2" /> Confirm suspend
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSuspending(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ApprenticeshipsTab() {
  const { apprenticeships } = useStore();
  if (apprenticeships.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink/15 p-12 text-center">
        <p className="font-serif text-ink-muted">
          No applications on file.{" "}
          <Link to="/apprenticeships" className="text-burgundy-500 underline">
            Submit one
          </Link>
          .
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {apprenticeships.map((a) => (
        <li key={a.id} className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div>
              <div className="font-display text-lg text-ink">{a.applicantName}</div>
              <div className="mt-0.5 font-sans text-xs text-ink-muted">
                {a.applicantEmail}
                {a.applicantAge ? ` · ${a.applicantAge} years` : ""} · craft: {a.craft}
              </div>
            </div>
            <Badge variant={a.status === "submitted" ? "gold" : "outline"}>{a.status}</Badge>
          </div>
          <p className="mt-3 font-serif text-base text-ink-soft leading-relaxed">
            {a.letter}
          </p>
          <div className="mt-3 font-sans text-xs text-ink-muted">
            {a.parishOrCommunity && (
              <>
                <strong>Parish:</strong> {a.parishOrCommunity}
                {" · "}
              </>
            )}
            {a.desiredMasterSlug && (
              <>
                <strong>Wants to apprentice with:</strong> {a.desiredMasterSlug}
                {" · "}
              </>
            )}
            {a.portfolioUrl && (
              <a href={a.portfolioUrl} className="underline" target="_blank" rel="noreferrer">
                Portfolio
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────── Bits ─────────────────────────

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "olive" | "burgundy";
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-4">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </div>
      <div
        className={
          "mt-2 font-display text-2xl tabular-nums " +
          (tone === "olive"
            ? "text-olive-600"
            : tone === "burgundy"
              ? "text-burgundy-500"
              : "text-ink")
        }
      >
        {value}
      </div>
    </div>
  );
}

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 font-sans text-xs uppercase tracking-[0.18em] focusable transition-colors " +
        (active
          ? "bg-ink text-parchment-50"
          : "bg-parchment-100 text-ink-soft hover:bg-parchment-200/70")
      }
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function AttentionRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 font-serif text-sm">
      {ok ? (
        <ShieldCheck className="h-4 w-4 text-olive-600 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-burgundy-500 shrink-0 mt-0.5" />
      )}
      <span className={ok ? "text-ink-soft" : "text-ink"}>{children}</span>
    </li>
  );
}

// Keep useless icons quiet
Mail; Award; GraduationCap;
