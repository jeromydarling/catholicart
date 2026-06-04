import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { categoryBySlug } from "../data/categories";
import { artistBySlug, artists } from "../data/artists";
import { useStore } from "../lib/store";
import { formatPrice, initials } from "../lib/utils";
import type { ApprovalStep, Proposal } from "../types";

export default function IntakeDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const store = useStore();
  const intake = store.getIntake(id);
  const proposals = useMemo(
    () => store.proposals.filter((p) => p.intakeId === id),
    [store.proposals, id],
  );

  if (!intake) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl">Brief not found.</h1>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/partnerships">All partnerships</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const craft = intake.craft === "mixed" ? null : categoryBySlug(intake.craft);
  const allApproved =
    intake.approvalChain.length > 0 &&
    intake.approvalChain.every((s) => s.status === "approved");

  return (
    <PageShell>
      <section className="container pt-10 sm:pt-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-3">
          <Link to="/partnerships" className="hover:text-burgundy-500">
            Partnerships
          </Link>{" "}
          ›{" "}
          <span>Open brief</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-2">
              <Building2 className="inline h-3 w-3 mr-1.5" />
              {intake.diocese ?? intake.institutionName}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ink leading-[1.05]">
              {intake.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={intake.status === "open" ? "gold" : intake.status === "awarded" ? "olive" : "lapis"}>
              {intake.status}
            </Badge>
            <Badge variant="outline">{intake.invoicingTerms.toUpperCase()}</Badge>
            {intake.poNumber && (
              <Badge variant="outline">PO · {intake.poNumber}</Badge>
            )}
          </div>
        </div>
        <Ornament className="my-8" />
      </section>

      <section className="container grid lg:grid-cols-12 gap-8 lg:gap-10 pb-16">
        {/* Brief */}
        <div className="lg:col-span-7 space-y-8">
          <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-7">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
              The brief
            </div>
            <p className="font-serif text-base sm:text-lg text-ink-soft leading-relaxed whitespace-pre-line">
              {intake.brief}
            </p>

            <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-ink/10">
              <Stat label="Works">{intake.quantity}</Stat>
              <Stat label="Total budget">
                {intake.budgetTotalUsd ? formatPrice(intake.budgetTotalUsd) : "—"}
              </Stat>
              <Stat label="Per work">
                {intake.budgetPerWorkUsd ? formatPrice(intake.budgetPerWorkUsd) : "—"}
              </Stat>
              <Stat label="Delivery">
                {intake.preferredDelivery
                  ? new Date(intake.preferredDelivery).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </Stat>
            </dl>
            {craft && (
              <div className="mt-3 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                Craft · {craft.name}
              </div>
            )}
            {intake.feastDeadline && (
              <div className="mt-2 font-serif text-sm italic text-ink-soft">
                For {intake.feastDeadline.name}
              </div>
            )}
          </div>

          {/* Proposals */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl text-ink leading-tight">
                Proposals received
              </h2>
              <Badge variant="outline" className="tabular-nums">
                {proposals.length}
              </Badge>
            </div>
            {proposals.length === 0 ? (
              <div className="rounded-md border border-dashed border-ink/15 p-8 text-center">
                <p className="font-serif text-ink-muted">
                  No proposals yet. Artists vetted for this craft will receive
                  notifications.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {proposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    canAward={allApproved && intake.status === "open"}
                    onAward={() => store.awardProposal(intake.id, p.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Submit a proposal (artist persona) */}
          {(intake.status === "open" || intake.status === "shortlisting") && (
            <ProposalForm intakeId={intake.id} />
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Approval chain */}
          <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-4">
              Approval chain
            </div>
            <ol className="space-y-3">
              {intake.approvalChain.map((step) => (
                <ApprovalRow
                  key={step.role}
                  step={step}
                  onApprove={() =>
                    store.setApprovalStep(intake.id, step.role, "approved")
                  }
                  onDecline={() =>
                    store.setApprovalStep(intake.id, step.role, "declined")
                  }
                />
              ))}
            </ol>
            {allApproved ? (
              <div className="mt-5 pt-4 border-t border-ink/10 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-olive-600 mt-0.5 shrink-0" />
                <p className="font-serif text-sm text-ink-soft">
                  All stakeholders have signed off. You can award a proposal.
                </p>
              </div>
            ) : (
              <p className="mt-4 font-sans text-xs italic text-ink-muted">
                Award is gated until every stakeholder approves.
              </p>
            )}
          </div>

          {/* Contact */}
          <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
              Posted by
            </div>
            <div className="font-display text-lg text-ink">{intake.contactName}</div>
            {intake.contactRole && (
              <div className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted mt-0.5">
                {intake.contactRole}
              </div>
            )}
            <div className="mt-2 font-sans text-sm text-ink-soft">
              {intake.contactEmail}
            </div>
            <div className="mt-3 font-sans text-xs text-ink-muted">
              Posted{" "}
              {new Date(intake.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-lg text-ink tabular-nums">
        {children}
      </div>
    </div>
  );
}

function ApprovalRow({
  step,
  onApprove,
  onDecline,
}: {
  step: ApprovalStep;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const Icon =
    step.status === "approved"
      ? CheckCircle2
      : step.status === "declined"
        ? XCircle
        : Clock;
  const toneClass =
    step.status === "approved"
      ? "bg-olive-500 text-parchment-50"
      : step.status === "declined"
        ? "bg-burgundy-500 text-parchment-50"
        : "bg-gold-500/15 text-gold-600";
  return (
    <li className="flex items-start gap-3">
      <div
        className={
          "grid h-7 w-7 shrink-0 place-items-center rounded-full mt-0.5 " + toneClass
        }
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="grow min-w-0">
        <div className="font-display text-base text-ink">{step.role}</div>
        {step.name && (
          <div className="font-sans text-xs text-ink-muted truncate">{step.name}</div>
        )}
        {step.decidedAt && (
          <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted mt-0.5 tabular-nums">
            {step.status} · {new Date(step.decidedAt).toLocaleDateString()}
          </div>
        )}
        {step.status === "pending" && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={onApprove}>
              Sign off
            </Button>
            <Button size="sm" variant="link" onClick={onDecline}>
              Decline
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

function ProposalCard({
  proposal,
  canAward,
  onAward,
}: {
  proposal: Proposal;
  canAward: boolean;
  onAward: () => void;
}) {
  const artist = artistBySlug(proposal.artistSlug);
  const tone =
    proposal.status === "awarded"
      ? "olive"
      : proposal.status === "shortlisted"
        ? "gold"
        : proposal.status === "declined"
          ? "burgundy"
          : "lapis";
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden"
    >
      {/* Plate */}
      <div
        className="aspect-[5/2] relative"
        style={{
          background: `linear-gradient(135deg, ${proposal.paletteFrom ?? artist?.portraitFrom ?? "#5d6f3d"}, ${proposal.paletteTo ?? artist?.portraitTo ?? "#1f2a11"})`,
        }}
      >
        <div className="absolute inset-3 border border-parchment-50/15" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-4 text-parchment-50 flex items-baseline justify-between">
          <div>
            <div className="font-display text-lg leading-tight">{proposal.artistName}</div>
            {artist && (
              <div className="font-sans text-[10px] uppercase tracking-[0.18em] opacity-80">
                {artist.city}
              </div>
            )}
          </div>
          <Badge variant={tone}>{proposal.status}</Badge>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Stat label="Per work">{formatPrice(proposal.pricePerWorkUsd)}</Stat>
          <Stat label="Total">{formatPrice(proposal.totalPriceUsd)}</Stat>
          <Stat label="Estimate">{proposal.estimatedWeeks} weeks</Stat>
        </div>
        <p className="font-serif text-base text-ink-soft leading-relaxed">
          {proposal.pitchBody}
        </p>
        <div className="mt-4 flex items-baseline justify-between gap-3 flex-wrap">
          <div className="font-sans text-xs text-ink-muted tabular-nums">
            Submitted{" "}
            {new Date(proposal.submittedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </div>
          {proposal.status !== "awarded" && proposal.status !== "declined" && canAward && (
            <Button size="sm" variant="default" onClick={onAward}>
              <Award className="h-4 w-4 mr-2" /> Award this proposal
            </Button>
          )}
          {proposal.status === "awarded" && (
            <Badge variant="olive">
              <Award className="h-3 w-3 mr-1" /> Awarded
            </Badge>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function ProposalForm({ intakeId }: { intakeId: string }) {
  const store = useStore();
  const [artistSlug, setArtistSlug] = useState<string>(artists[0]?.slug ?? "");
  const [perWork, setPerWork] = useState("");
  const [weeks, setWeeks] = useState("");
  const [pitch, setPitch] = useState("");

  const intake = store.getIntake(intakeId);
  if (!intake) return null;
  const total = perWork ? Number(perWork) * intake.quantity : 0;

  return (
    <div className="rounded-md border border-burgundy-500/30 bg-burgundy-500/5 p-5 sm:p-7">
      <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-burgundy-500 mb-2">
        Artist · submit a proposal
      </div>
      <h3 className="font-display text-xl text-ink leading-tight mb-1">
        Pitch the institution.
      </h3>
      <p className="font-serif text-sm text-ink-soft mb-4 leading-relaxed">
        In the prototype you can pitch as any guild artist. In production this
        is gated to logged-in artists with relevant craft tags.
      </p>
      <div className="space-y-4">
        <Label className="block space-y-1.5">
          <span className="block">Pitching as</span>
          <select
            value={artistSlug}
            onChange={(e) => setArtistSlug(e.target.value)}
            className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
          >
            {artists.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.honorific ? `${a.honorific} ` : ""}
                {a.name} · {a.city}
              </option>
            ))}
          </select>
        </Label>
        <div className="grid sm:grid-cols-2 gap-4">
          <Label className="block space-y-1.5">
            <span className="block">Price per work (USD)</span>
            <Input
              type="number"
              min={100}
              step={50}
              value={perWork}
              onChange={(e) => setPerWork(e.target.value)}
              placeholder={intake.budgetPerWorkUsd?.toString() ?? ""}
            />
          </Label>
          <Label className="block space-y-1.5">
            <span className="block">Estimated weeks</span>
            <Input
              type="number"
              min={1}
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              placeholder="e.g. 28"
            />
          </Label>
        </div>
        <Label className="block space-y-1.5">
          <span className="block">Your pitch</span>
          <Textarea
            rows={5}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="Materials, dimensions, approach, why you. A few sentences of plain English."
          />
        </Label>
        {total > 0 && (
          <p className="font-sans text-xs text-ink-muted tabular-nums">
            Total for {intake.quantity} works: {formatPrice(total)}
            {intake.budgetTotalUsd && total > intake.budgetTotalUsd && (
              <span className="text-burgundy-500"> · over budget by {formatPrice(total - intake.budgetTotalUsd)}</span>
            )}
          </p>
        )}
        <Button
          disabled={!perWork || !weeks || !pitch.trim()}
          onClick={() => {
            const artist = artistBySlug(artistSlug);
            if (!artist || !perWork || !weeks) return;
            store.submitProposal({
              intakeId,
              artistSlug,
              artistName: artist.name,
              pricePerWorkUsd: Number(perWork),
              totalPriceUsd: Number(perWork) * intake.quantity,
              estimatedWeeks: Number(weeks),
              pitchBody: pitch.trim(),
              paletteFrom: artist.portraitFrom,
              paletteTo: artist.portraitTo,
            });
            setPerWork("");
            setWeeks("");
            setPitch("");
          }}
        >
          <Send className="h-4 w-4 mr-2" /> Submit proposal
        </Button>
      </div>
    </div>
  );
}

// keep imports live for editor / silence unused warnings
FileText; ArrowRight;
