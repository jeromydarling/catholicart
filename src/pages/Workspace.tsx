import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { artistBySlug } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { EscrowMeter } from "../components/EscrowMeter";
import { StarRating } from "../components/StarRating";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";
import { computePricing, PLATFORM_FEE_PCT } from "../lib/pricing";
import { cn, deriveTitle, formatPrice, initials } from "../lib/utils";
import type { Commission, CommissionStage } from "../types";

const STAGE_COPY: Record<
  CommissionStage,
  { label: string; tone: "gold" | "olive" | "burgundy" | "outline" | "lapis" }
> = {
  scoping:           { label: "Awaiting quote",         tone: "gold" },
  "awaiting-deposit":{ label: "Awaiting deposit",        tone: "gold" },
  "in-progress":     { label: "In the studio",           tone: "lapis" },
  "midpoint-review": { label: "Midpoint · review",       tone: "gold" },
  "final-review":    { label: "Final · review",          tone: "gold" },
  delivered:         { label: "Delivered",               tone: "olive" },
  blessed:           { label: "Delivered · blessed",     tone: "olive" },
  cancelled:         { label: "Cancelled",               tone: "burgundy" },
};

type Persona = "patron" | "artist";

export default function Workspace() {
  const { id = "" } = useParams<{ id: string }>();
  const store = useStore();
  const commission = store.getCommission(id);
  const [persona, setPersona] = useState<Persona>("patron");
  const [composeBody, setComposeBody] = useState("");

  if (!commission) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl">Commission not found</h1>
          <p className="mt-3 font-serif text-ink-muted">
            The link may be stale, or this commission was started in another browser.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/dashboard">Your dashboard</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const artist = artistBySlug(commission.artistSlug);
  const cat = categoryBySlug(commission.category);
  const stageCopy = STAGE_COPY[commission.stage];

  // Combined timeline of messages + WIP, sorted chronologically
  const timeline = useMemo(() => {
    const items: Array<
      | { kind: "message"; data: Commission["messages"][number] }
      | { kind: "wip"; data: Commission["wip"][number] }
    > = [
      ...commission.messages.map((m) => ({ kind: "message" as const, data: m })),
      ...commission.wip.map((w) => ({ kind: "wip" as const, data: w })),
    ];
    items.sort((a, b) => {
      const at = a.kind === "message" ? a.data.createdAt : a.data.postedAt;
      const bt = b.kind === "message" ? b.data.createdAt : b.data.postedAt;
      return new Date(at).getTime() - new Date(bt).getTime();
    });
    return items;
  }, [commission.messages, commission.wip]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeBody.trim()) return;
    store.addMessage(
      commission.id,
      persona,
      persona === "patron" ? commission.patronName : artist?.name ?? "Artist",
      composeBody.trim(),
    );
    setComposeBody("");
  };

  return (
    <PageShell>
      <Seo
        title={`${deriveTitle(commission.scope, 60)} · Commission · Ars Sacra`}
        description={`Commission workspace for ${commission.patronName} and ${artist?.name ?? "the artist"}. Status: ${stageCopy.label}.`}
        path={`/workspace/${commission.id}`}
        robots="noindex,nofollow"
      />
      <section className="container pt-10 sm:pt-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-3 flex items-center gap-2 flex-wrap">
          <Link to="/dashboard" className="hover:text-burgundy-500">
            Dashboard
          </Link>
          <span>›</span>
          <span>Commission · {cat?.shortName}</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ink leading-[1.05]">
              {deriveTitle(commission.scope) || "Commission"}
            </h1>
            <p className="mt-3 font-serif text-base text-ink-muted max-w-2xl">
              <span>For {commission.setting.toLowerCase()}</span>
              {commission.parishOrChapel && (
                <>
                  {" · "}
                  <span>{commission.parishOrChapel}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={stageCopy.tone}>{stageCopy.label}</Badge>
            {commission.feastDeadline ? (
              <Badge variant="lapis">
                For {commission.feastDeadline.name} ·{" "}
                {formatDateShort(commission.feastDeadline.date)}
              </Badge>
            ) : commission.preferredDeadline ? (
              <Badge variant="outline">
                Due {formatDateShort(commission.preferredDeadline)}
              </Badge>
            ) : null}
          </div>
        </div>
        <Ornament className="my-8" />
      </section>

      {/* Persona switcher: prototype-only honesty */}
      <section className="container">
        <div className="rounded-md border border-dashed border-burgundy-500/30 bg-burgundy-500/5 p-3 sm:p-4 mb-8 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="flex items-start gap-3 grow">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-burgundy-500/10">
              <Sparkles className="h-4 w-4 text-burgundy-500" />
            </div>
            <div className="grow">
              <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-burgundy-500 mb-0.5">
                Prototype simulation
              </div>
              <p className="font-serif text-sm text-ink-soft leading-relaxed">
                In a real deployment, the patron and the artist would each see
                their own controls. Here, you can switch perspective to step
                through the full commission lifecycle.
              </p>
            </div>
          </div>
          <div className="sm:shrink-0 sm:ml-auto sm:self-center">
            <PersonaToggle persona={persona} onChange={setPersona} patronName={commission.patronName} artistName={artist?.name ?? "Artist"} />
          </div>
        </div>
      </section>

      {/* Two-column workspace */}
      <section className="container grid lg:grid-cols-12 gap-8 lg:gap-10 pb-20">
        {/* LEFT: studio reel + thread */}
        <div className="lg:col-span-7 space-y-6">
          {/* The artist's hand made visible. Appears the moment the
              first WIP is posted; the thread takes second place. */}
          {commission.wip.length > 0 && <StudioReel wip={commission.wip} />}

          <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-7">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-4">
              {commission.wip.length > 0 ? "Conversation" : "Studio thread"}
            </div>
            <ol className="space-y-5">
              {timeline.map((item, i) =>
                item.kind === "message" ? (
                  <MessageRow
                    key={item.data.id}
                    item={item.data}
                    isLast={i === timeline.length - 1}
                  />
                ) : (
                  <WipRow key={item.data.id} item={item.data} />
                ),
              )}
            </ol>

            {/* Composer */}
            {commission.stage !== "cancelled" && (
              <form
                onSubmit={sendMessage}
                className="mt-7 pt-5 border-t border-ink/10 space-y-3"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Label
                    htmlFor="workspace-composer"
                    className="text-[11px] uppercase tracking-[0.22em] text-ink-muted"
                  >
                    Reply as {persona === "patron" ? commission.patronName : artist?.name}
                  </Label>
                </div>
                <Textarea
                  id="workspace-composer"
                  rows={3}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder={
                    persona === "patron"
                      ? "Ask a question, send a reference, or thank the artist…"
                      : "Update the patron, ask a clarifying question…"
                  }
                />
                <div className="flex items-center justify-end">
                  <Button type="submit" size="sm" disabled={!composeBody.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT: pricing, escrow, stage actions */}
        <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Patron + Artist card */}
          <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-4">
              Parties
            </div>
            <div className="space-y-4">
              <PartyRow
                role="Patron"
                name={commission.patronName}
                detail={commission.patronEmail}
              />
              {artist && (
                <PartyRow
                  role="Artist"
                  name={`${artist.honorific ? artist.honorific + " " : ""}${artist.name}`}
                  detail={`${cat?.name} · ${artist.city}`}
                  paletteFrom={artist.portraitFrom}
                  paletteTo={artist.portraitTo}
                  link={`/artists/${artist.slug}`}
                />
              )}
            </div>
          </div>

          {/* Pricing breakdown */}
          {commission.artistTotalUsd != null && (
            <PricingCard commission={commission} />
          )}

          {/* Escrow */}
          <EscrowMeter escrow={commission.escrow} />

          {/* Stage action */}
          <StageAction
            commission={commission}
            persona={persona}
            artistName={artist?.name ?? "Artist"}
          />

          {/* Shipping (artist's tool, post-delivery) */}
          {(commission.stage === "delivered" || commission.stage === "blessed") && (
            <ShippingBlock commission={commission} persona={persona} />
          )}

          {/* Review (patron's tool, post-delivery) */}
          {(commission.stage === "delivered" || commission.stage === "blessed") && (
            <ReviewBlock commission={commission} persona={persona} />
          )}

          {/* IP terms display */}
          <IpTermsBlock commission={commission} persona={persona} />

          {/* Dispute (open to both at any non-terminal stage) */}
          {commission.stage !== "cancelled" && (
            <DisputeBlock commission={commission} persona={persona} />
          )}

          {/* Certificate of authenticity (only when complete) */}
          {commission.certificate && (
            <CertificateCard commission={commission} />
          )}
        </aside>
      </section>
    </PageShell>
  );
}

// ───────── Persona switch ─────────
function PersonaToggle({
  persona,
  onChange,
  patronName,
  artistName,
}: {
  persona: Persona;
  onChange: (p: Persona) => void;
  patronName: string;
  artistName: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Switch perspective"
      className="inline-flex rounded-full bg-parchment-200/60 p-1"
    >
      {(["patron", "artist"] as const).map((p) => (
        <button
          key={p}
          role="tab"
          aria-selected={persona === p}
          onClick={() => onChange(p)}
          className={cn(
            "min-h-[36px] px-4 py-2 rounded-full font-sans text-[11px] uppercase tracking-[0.18em] transition-colors",
            persona === p
              ? "bg-ink text-parchment-50"
              : "text-ink-soft hover:text-ink",
          )}
        >
          {p === "patron" ? "Patron" : "Artist"}
          <span className="sr-only">
            {p === "patron" ? ` (${patronName})` : ` (${artistName})`}
          </span>
        </button>
      ))}
    </div>
  );
}

// ───────── Party row ─────────
function PartyRow({
  role,
  name,
  detail,
  paletteFrom,
  paletteTo,
  link,
}: {
  role: string;
  name: string;
  detail?: string;
  paletteFrom?: string;
  paletteTo?: string;
  link?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="h-10 w-10 rounded-full grid place-items-center text-parchment-50 font-display text-sm shrink-0"
        style={{
          background:
            paletteFrom && paletteTo
              ? `linear-gradient(135deg, ${paletteFrom}, ${paletteTo})`
              : "linear-gradient(135deg, #58413c 0%, #2a1d1a 100%)",
        }}
      >
        {initials(name)}
      </div>
      <div className="grow min-w-0">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          {role}
        </div>
        <div className="font-display text-base text-ink truncate">
          {link ? (
            <Link to={link} className="hover:text-burgundy-500">
              {name}
            </Link>
          ) : (
            name
          )}
        </div>
        {detail && (
          <div className="font-sans text-xs text-ink-muted truncate">{detail}</div>
        )}
      </div>
    </div>
  );
}

// ───────── Pricing card ─────────
function PricingCard({ commission }: { commission: Commission }) {
  const artist = commission.artistTotalUsd ?? 0;
  const fee = commission.platformFeeUsd ?? 0;
  const total = commission.totalDueUsd ?? artist + fee;
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-4">
        Pricing
      </div>
      <dl className="space-y-2 text-sm">
        <Row label="Artist receives" value={formatPrice(artist)} strong />
        <Row
          label={`Platform fee · ${Math.round(commission.platformFeePct * 100)}%`}
          value={formatPrice(fee)}
          muted
        />
        <div className="my-2 border-t border-ink/10" />
        <Row label="Total paid by patron" value={formatPrice(total)} strong total />
      </dl>
      <p className="mt-4 font-serif text-xs italic text-ink-muted leading-relaxed">
        The artist receives <strong className="not-italic">100%</strong> of
        what they quoted. Our fee is added on top — paid by the patron, never
        deducted from the artist.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
  total,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  total?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt
        className={cn(
          "font-sans",
          muted ? "text-ink-muted" : "text-ink-soft",
          total ? "text-[11px] uppercase tracking-[0.22em]" : "",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums",
          strong ? "font-display text-lg text-ink" : "font-sans text-ink-soft",
          total ? "text-burgundy-500" : "",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// ───────── Stage action panel ─────────
function StageAction({
  commission,
  persona,
  artistName,
}: {
  commission: Commission;
  persona: Persona;
  artistName: string;
}) {
  const store = useStore();
  const [quoteUsd, setQuoteUsd] = useState<string>("");
  const [quoteVision, setQuoteVision] = useState<string>("");
  const [quoteNote, setQuoteNote] = useState<string>("");
  const [wipCaption, setWipCaption] = useState<string>("");
  const [midpointNote, setMidpointNote] = useState<string>("");
  const [finalNote, setFinalNote] = useState<string>("");
  const [blessingBy, setBlessingBy] = useState("");
  const [blessingAt, setBlessingAt] = useState("");

  // Live pricing preview while quoting
  const previewPricing = useMemo(() => {
    const v = Number(quoteUsd);
    if (!Number.isFinite(v) || v <= 0) return null;
    return computePricing(v);
  }, [quoteUsd]);

  // Wrapper for action panel chrome
  const Card = ({
    title,
    note,
    children,
  }: {
    title: string;
    note?: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
        Next step
      </div>
      <div className="font-display text-xl text-ink">{title}</div>
      {note && (
        <p className="mt-1 font-serif text-sm text-ink-muted leading-relaxed">
          {note}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );

  // ── Stage: scoping (artist needs to quote) ────────────
  if (commission.stage === "scoping") {
    if (persona !== "artist") {
      return (
        <WaitingFor
          title="Awaiting the artist's quote"
          body="The artist will reply with clarifying questions, materials, and a price. Switch to the artist's perspective to send a quote in the prototype."
        />
      );
    }
    return (
      <Card
        title="Write back. Then quote."
        note="Begin with what you saw when you read their letter — the image, the saint, the silence. The price follows the vision; it does not lead it."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quote-vision">Your vision</Label>
            <Textarea
              id="quote-vision"
              rows={7}
              value={quoteVision}
              onChange={(e) => setQuoteVision(e.target.value)}
              placeholder="What do you see when you read their letter? The figure, the gesture, the ground, the light. A few paragraphs are enough."
            />
            <p className="font-serif text-xs italic text-ink-muted">
              At least a few sentences — this is the artist's first
              answer to the patron, before any number.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote-note">Practical note (optional)</Label>
            <Textarea
              id="quote-note"
              rows={3}
              value={quoteNote}
              onChange={(e) => setQuoteNote(e.target.value)}
              placeholder="Materials, dimensions, turnaround — anything specific to the price."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote-usd">Your price (USD)</Label>
            <Input
              id="quote-usd"
              type="number"
              min={50}
              step={50}
              inputMode="numeric"
              value={quoteUsd}
              onChange={(e) => setQuoteUsd(e.target.value)}
              placeholder="What you want to be paid, in full"
            />
          </div>
          {previewPricing && (
            <div className="rounded-md bg-parchment-100 p-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-muted">You receive</span>
                <span className="tabular-nums font-display text-base text-ink">
                  {formatPrice(previewPricing.artistTotalUsd)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-ink-muted">
                  Guild tithe · {Math.round(PLATFORM_FEE_PCT * 100)}% at the end
                </span>
                <span className="tabular-nums text-ink-muted">
                  {formatPrice(previewPricing.platformFeeUsd)}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-ink-muted">Patron pays</span>
                <span className="tabular-nums font-display text-base text-burgundy-500">
                  {formatPrice(previewPricing.totalDueUsd)}
                </span>
              </div>
            </div>
          )}
          <Button
            className="w-full"
            disabled={!previewPricing || quoteVision.trim().length < 80}
            onClick={() => {
              if (!previewPricing) return;
              store.artistQuote(
                commission.id,
                previewPricing.artistTotalUsd,
                quoteNote.trim(),
                quoteVision.trim(),
              );
              setQuoteUsd("");
              setQuoteVision("");
              setQuoteNote("");
            }}
          >
            Send vision and quote <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // ── Stage: awaiting deposit ───────────────────────────
  if (commission.stage === "awaiting-deposit") {
    if (persona !== "patron") {
      return (
        <WaitingFor
          title="Awaiting the patron's deposit"
          body={`Once ${commission.patronName} funds the deposit, your work begins.`}
        />
      );
    }
    const deposit = commission.escrow.find((m) => m.stage === "deposit");
    return (
      <Card
        title="Fund the deposit"
        note={`Hold ${formatPrice(deposit?.amountUsd ?? 0)} in escrow. Released to the artist when work begins.`}
      >
        <FundButton
          amount={deposit?.amountUsd ?? 0}
          totalDue={commission.totalDueUsd ?? 0}
          onConfirm={() => store.fundEscrow(commission.id, "deposit")}
          label="Fund deposit"
        />
        <p className="mt-3 font-serif text-xs italic text-ink-muted leading-relaxed">
          Payment is mocked in the prototype. In production this is a real
          Stripe Connect charge with funds held until you release each milestone.
        </p>
      </Card>
    );
  }

  // ── Stage: in-progress (artist marks midpoint or final, posts WIP) ────
  if (commission.stage === "in-progress") {
    const midpointReleased =
      commission.escrow.find((m) => m.stage === "midpoint")?.status === "released";
    if (persona === "artist") {
      return (
        <div className="space-y-6">
          <Card
            title="Post a studio update"
            note="Share an in-progress photo or note with the patron."
          >
            <div className="space-y-3">
              <Input
                value={wipCaption}
                onChange={(e) => setWipCaption(e.target.value)}
                placeholder="e.g. Underdrawing complete"
              />
              <Button
                size="sm"
                disabled={!wipCaption.trim()}
                onClick={() => {
                  store.addWip(commission.id, {
                    caption: wipCaption.trim(),
                    paletteFrom: pickPalette(commission.wip.length).from,
                    paletteTo: pickPalette(commission.wip.length).to,
                    pattern: pickPattern(commission.wip.length),
                  });
                  setWipCaption("");
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Post update
              </Button>
            </div>
          </Card>
          {midpointReleased ? (
            <Card
              title="Mark the work complete"
              note="Show the finished piece. The patron will inspect and release the final payment."
            >
              <div className="space-y-3">
                <Textarea
                  rows={3}
                  value={finalNote}
                  onChange={(e) => setFinalNote(e.target.value)}
                  placeholder="A note for the patron — finishing details, varnish, framing, packing."
                />
                <Button
                  size="sm"
                  variant="gold"
                  disabled={!finalNote.trim()}
                  onClick={() => {
                    store.artistMarkFinal(commission.id, finalNote.trim());
                    setFinalNote("");
                  }}
                >
                  Mark complete <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card
              title="Mark the midpoint"
              note="When the patron should review the work and release the midpoint payment."
            >
              <div className="space-y-3">
                <Textarea
                  rows={3}
                  value={midpointNote}
                  onChange={(e) => setMidpointNote(e.target.value)}
                  placeholder="Show what's done. Ask for the patron's eye before continuing."
                />
                <Button
                  size="sm"
                  variant="gold"
                  disabled={!midpointNote.trim()}
                  onClick={() => {
                    store.artistMarkMidpoint(commission.id, midpointNote.trim());
                    setMidpointNote("");
                  }}
                >
                  Mark midpoint <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      );
    }
    return (
      <WaitingFor
        title="In the studio"
        body={`${artistName} is at work. Studio updates appear in the thread; you'll be notified at the next milestone.`}
      />
    );
  }

  // ── Stage: midpoint review ────────────────────────────
  if (commission.stage === "midpoint-review") {
    if (persona !== "patron") {
      return (
        <WaitingFor
          title="Awaiting the patron's midpoint review"
          body={`${commission.patronName} will release the midpoint payment when ready.`}
        />
      );
    }
    const m = commission.escrow.find((x) => x.stage === "midpoint");
    return (
      <Card
        title="Release the midpoint"
        note={`${formatPrice(m?.amountUsd ?? 0)} releases from escrow to the artist.`}
      >
        <Button
          className="w-full"
          variant="gold"
          onClick={() => {
            // First fund (if not already), then release. Patron flow folds these.
            const milestone = commission.escrow.find((x) => x.stage === "midpoint");
            if (milestone?.status === "unfunded") {
              store.fundEscrow(commission.id, "midpoint");
            }
            store.releaseMilestone(commission.id, "midpoint");
          }}
        >
          Release midpoint <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    );
  }

  // ── Stage: final review ───────────────────────────────
  if (commission.stage === "final-review") {
    if (persona !== "patron") {
      return (
        <WaitingFor
          title="Awaiting the patron's final review"
          body={`${commission.patronName} will release the final payment when ready.`}
        />
      );
    }
    const f = commission.escrow.find((x) => x.stage === "final");
    return (
      <Card
        title="Release the final payment"
        note={`${formatPrice(f?.amountUsd ?? 0)} releases. You'll receive a certificate of authenticity.`}
      >
        <Button
          className="w-full"
          variant="gold"
          onClick={() => {
            const milestone = commission.escrow.find((x) => x.stage === "final");
            if (milestone?.status === "unfunded") {
              store.fundEscrow(commission.id, "final");
            }
            store.releaseMilestone(commission.id, "final");
          }}
        >
          Release & receive <ShieldCheck className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    );
  }

  // ── Stage: delivered (record blessing, view certificate) ───
  if (commission.stage === "delivered") {
    return (
      <Card
        title="Record the blessing"
        note="Optional. Add the priest who blessed the work and where it was installed."
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bless-by">Blessed by</Label>
            <Input
              id="bless-by"
              value={blessingBy}
              onChange={(e) => setBlessingBy(e.target.value)}
              placeholder="e.g. Fr. James Aldworth"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bless-at">Parish or chapel</Label>
            <Input
              id="bless-at"
              value={blessingAt}
              onChange={(e) => setBlessingAt(e.target.value)}
              placeholder="e.g. St. Cecilia's, Cleveland OH"
            />
          </div>
          <Button
            className="w-full"
            variant="ink"
            disabled={!blessingBy.trim()}
            onClick={() => {
              store.recordBlessing(commission.id, {
                recordedBy: blessingBy.trim(),
                parishOrChapel: blessingAt.trim() || undefined,
              });
              setBlessingBy("");
              setBlessingAt("");
            }}
          >
            Record blessing
          </Button>
        </div>
      </Card>
    );
  }

  if (commission.stage === "blessed") {
    return (
      <div className="rounded-md border border-olive-500/30 bg-olive-500/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-olive-600 shrink-0 mt-1" />
          <div>
            <div className="font-display text-xl text-ink">
              Delivered. Blessed. Recorded.
            </div>
            {commission.blessing && (
              <p className="mt-2 font-serif text-sm text-ink-soft leading-relaxed">
                Blessed by{" "}
                <strong className="font-medium">
                  {commission.blessing.recordedBy}
                </strong>
                {commission.blessing.parishOrChapel && (
                  <>
                    {" "}at <em>{commission.blessing.parishOrChapel}</em>
                  </>
                )}
                {commission.blessing.note && (
                  <>
                    {". "}
                    {commission.blessing.note}
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (commission.stage === "cancelled") {
    return (
      <div className="rounded-md border border-burgundy-500/30 bg-burgundy-500/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-burgundy-500 shrink-0 mt-1" />
          <div>
            <div className="font-display text-xl text-ink">
              Commission cancelled.
            </div>
            <p className="mt-1 font-serif text-sm text-ink-muted">
              Held funds were refunded to the patron.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Special: in-progress, after midpoint released, artist needs to mark final.
// We surface this by checking escrow state in a separate panel — appended below.

// ───────── Helpers ─────────
function WaitingFor({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-ink/15 bg-parchment-50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-gold-600 shrink-0 mt-1" />
        <div>
          <div className="font-display text-lg text-ink">{title}</div>
          <p className="mt-1 font-serif text-sm text-ink-muted leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function FundButton({
  amount,
  totalDue,
  onConfirm,
  label,
}: {
  amount: number;
  totalDue: number;
  onConfirm: () => void;
  label: string;
}) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <div className="space-y-2">
      <div className="rounded-md bg-parchment-100 p-3 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-ink-muted">This milestone</span>
          <span className="tabular-nums font-display text-base text-ink">
            {formatPrice(amount)}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-ink-muted">
          Total commission cost: {formatPrice(totalDue)} (paid in three milestones)
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="grow" variant="gold" onClick={onConfirm}>
          <Lock className="h-4 w-4 mr-2" />
          Confirm — fund {formatPrice(amount)}
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <Button className="w-full" variant="gold" onClick={() => setConfirming(true)}>
      {label} ({formatPrice(amount)}) <ArrowRight className="h-4 w-4 ml-2" />
    </Button>
  );
}

function MessageRow({
  item,
  isLast: _isLast,
}: {
  item: Commission["messages"][number];
  isLast: boolean;
}) {
  const isSystem = item.authorRole === "system";
  if (isSystem) {
    return (
      <li className="flex items-start gap-3 pl-1">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-parchment-200/70 text-ink-muted">
          <Mail className="h-3 w-3" />
        </div>
        <div className="grow">
          <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            {formatTimestamp(item.createdAt)}
          </div>
          <p className="mt-0.5 font-serif text-sm italic text-ink-muted leading-relaxed">
            {item.body}
          </p>
        </div>
      </li>
    );
  }
  const isArtist = item.authorRole === "artist";
  return (
    <li
      className={cn(
        "flex items-start gap-3",
        isArtist ? "" : "flex-row-reverse text-right",
      )}
    >
      <div
        className={cn(
          "h-9 w-9 shrink-0 rounded-full grid place-items-center font-display text-sm",
          isArtist ? "bg-lapis-600 text-parchment-50" : "bg-burgundy-500 text-parchment-50",
        )}
      >
        {initials(item.authorName)}
      </div>
      <div
        className={cn(
          "grow max-w-[90%]",
          isArtist ? "" : "items-end",
        )}
      >
        <div
          className={cn(
            "font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted",
          )}
        >
          {item.authorName} · {formatTimestamp(item.createdAt)}
        </div>
        <div
          className={cn(
            "mt-1 inline-block rounded-md px-3 py-2 text-left max-w-full",
            isArtist
              ? "bg-lapis-600/10 text-ink"
              : "bg-burgundy-500/10 text-ink",
          )}
        >
          <p className="font-serif text-[15px] leading-relaxed whitespace-pre-line">
            {item.body}
          </p>
        </div>
      </div>
    </li>
  );
}

// The studio reel — the visible spine of the workspace once work has
// begun. Newest update sits at the top, full-bleed; older updates
// shrink to a quiet gallery beneath. The escrow buttons exist
// elsewhere; this is the artist's hand.
function StudioReel({ wip }: { wip: Commission["wip"] }) {
  const sorted = [...wip].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
  );
  const [head, ...rest] = sorted;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden"
    >
      <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
            From the studio
          </div>
          <div className="mt-1 font-display text-xl text-ink">
            The work as it comes.
          </div>
        </div>
        <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted tabular-nums">
          {sorted.length} {sorted.length === 1 ? "update" : "updates"}
        </div>
      </div>
      {head && (
        <figure className="border-t border-ink/10">
          <div
            className="aspect-[16/10] relative"
            style={{
              background: `linear-gradient(135deg, ${head.paletteFrom}, ${head.paletteTo})`,
            }}
          >
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
              }}
              aria-hidden
            />
            <div className="absolute inset-0 grid place-items-center text-parchment-50/85">
              <PatternHint pattern={head.pattern} />
            </div>
          </div>
          <figcaption className="px-5 sm:px-7 py-4 bg-parchment-50">
            <p className="font-serif text-base text-ink leading-relaxed">
              {head.caption}
            </p>
            <div className="mt-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              {formatTimestamp(head.postedAt)}
            </div>
          </figcaption>
        </figure>
      )}
      {rest.length > 0 && (
        <div className="border-t border-ink/10 p-4 sm:p-5">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-3">
            Earlier
          </div>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {rest.map((w) => (
              <li
                key={w.id}
                className="aspect-square rounded-sm overflow-hidden relative ring-1 ring-ink/10"
                style={{
                  background: `linear-gradient(135deg, ${w.paletteFrom}, ${w.paletteTo})`,
                }}
                title={w.caption}
              >
                <div className="absolute inset-0 grid place-items-center text-parchment-50/70">
                  <PatternHint pattern={w.pattern} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function WipRow({ item }: { item: Commission["wip"][number] }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-3"
    >
      <div className="h-9 w-9 shrink-0 rounded-full bg-gold-500/20 text-gold-600 grid place-items-center">
        <ImageIcon className="h-4 w-4" />
      </div>
      <div className="grow">
        <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Studio update · {formatTimestamp(item.postedAt)}
        </div>
        <div className="mt-2 rounded-md overflow-hidden border border-ink/10">
          <div
            className="aspect-[16/10] relative"
            style={{
              background: `linear-gradient(135deg, ${item.paletteFrom}, ${item.paletteTo})`,
            }}
          >
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
              }}
              aria-hidden
            />
            <div className="absolute inset-0 grid place-items-center text-parchment-50/85">
              <PatternHint pattern={item.pattern} />
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-parchment-50">
            <p className="font-serif text-[15px] text-ink leading-snug">
              {item.caption}
            </p>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

function PatternHint({ pattern }: { pattern?: string }) {
  if (pattern === "halo") return <div className="h-24 w-24 rounded-full ring-2 ring-current opacity-60" />;
  if (pattern === "cross")
    return (
      <svg viewBox="0 0 80 100" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6">
        <path d="M40 10 v80 M14 38 h52" />
      </svg>
    );
  if (pattern === "vesica")
    return (
      <svg viewBox="0 0 80 100" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6">
        <path d="M40 14 C16 36 16 64 40 86 C64 64 64 36 40 14 Z" />
      </svg>
    );
  if (pattern === "frame")
    return <div className="h-24 w-24 ring-2 ring-current opacity-60 rounded-sm" />;
  return <div className="h-24 w-24 ring-2 ring-current opacity-50 rounded-full" />;
}

function CertificateCard({ commission }: { commission: Commission }) {
  return (
    <Link
      to={`/certificate/${commission.id}`}
      className="block rounded-md border border-gold-500/40 bg-gradient-to-br from-parchment-50 to-gold-500/10 p-5 sm:p-6 hover:border-gold-500 transition-colors focusable"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-gold-600 shrink-0 mt-1" />
        <div>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
            Certificate of authenticity
          </div>
          <div className="mt-1 font-display text-lg text-ink">
            {commission.certificate?.title}
          </div>
          <div className="mt-1 font-sans text-xs text-ink-muted tabular-nums">
            Serial · {commission.certificate?.serial}
          </div>
          <div className="mt-3 font-sans text-xs uppercase tracking-[0.18em] text-burgundy-500 inline-flex items-center">
            View provenance certificate <ArrowRight className="h-3 w-3 ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ───────── small helpers ─────────
const PALETTES: { from: string; to: string }[] = [
  { from: "#f5e6c8", to: "#e3c98c" },
  { from: "#d8c39a", to: "#a98859" },
  { from: "#f6d27a", to: "#b78521" },
  { from: "#e9c2a0", to: "#9a5a3a" },
  { from: "#cbd5b1", to: "#6f7e58" },
];
const PATTERNS: Array<"halo" | "cross" | "vesica" | "triptych" | "frame"> = [
  "halo",
  "vesica",
  "frame",
  "cross",
  "triptych",
];
function pickPalette(i: number) {
  return PALETTES[i % PALETTES.length];
}
function pickPattern(i: number) {
  return PATTERNS[i % PATTERNS.length];
}
function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Unused-import suppression for strict TS — these helpers might be inlined later.
useEffect; ArrowRight;

// ─────────────────────────────────────────────────────────────
// Review block — patron leaves a rating + body after delivered/blessed.
// ─────────────────────────────────────────────────────────────
function ReviewBlock({
  commission,
  persona,
}: {
  commission: Commission;
  persona: Persona;
}) {
  const store = useStore();
  const existing = store.reviewForCommission(commission.id);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");

  if (existing) {
    return (
      <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
          Patron's review
        </div>
        <div className="flex items-center gap-3 mb-3">
          <StarRating value={existing.rating} size="md" />
          <span className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted tabular-nums">
            {existing.rating}/5
          </span>
        </div>
        <p className="font-serif text-[15px] text-ink-soft leading-relaxed italic">
          "{existing.body}"
        </p>
        <div className="mt-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          {existing.patronName} ·{" "}
          {new Date(existing.createdAt).toLocaleDateString()}
        </div>

        {existing.artistReply ? (
          <div className="mt-4 pt-4 border-t border-ink/10">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-2">
              Artist's reply
            </div>
            <p className="font-serif text-sm text-ink-soft leading-relaxed">
              {existing.artistReply.body}
            </p>
          </div>
        ) : persona === "artist" ? (
          <div className="mt-4 pt-4 border-t border-ink/10 space-y-2">
            <Label htmlFor="rev-reply" className="text-[10px] uppercase tracking-[0.22em]">
              Reply to the patron
            </Label>
            <Textarea
              id="rev-reply"
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="A word of thanks, or context."
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!reply.trim()}
              onClick={() => {
                store.artistReplyToReview(existing.id, reply.trim());
                setReply("");
              }}
            >
              Send reply
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  // No review yet — only patron can leave one
  if (persona !== "patron") {
    return (
      <div className="rounded-md border border-dashed border-ink/15 bg-parchment-50 p-5 sm:p-6">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
          Patron's review
        </div>
        <p className="font-serif text-sm text-ink-muted">
          Once {commission.patronName} writes a review it will appear here
          and on your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
        Leave a review
      </div>
      <div className="font-display text-lg text-ink leading-tight mb-3">
        How did the commission feel?
      </div>
      <div className="space-y-3">
        <StarRating
          value={rating ?? 0}
          onChange={setRating}
          size="lg"
          label="Rating"
        />
        <Textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="A few sentences. Other patrons will read this when deciding."
        />
        <Button
          className="w-full"
          disabled={!rating || !body.trim()}
          onClick={() => {
            if (!rating) return;
            store.submitReview({ commissionId: commission.id, rating, body: body.trim() });
            setRating(null);
            setBody("");
          }}
        >
          Publish review
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shipping block — artist records carrier + tracking
// ─────────────────────────────────────────────────────────────
function ShippingBlock({
  commission,
  persona,
}: {
  commission: Commission;
  persona: Persona;
}) {
  const store = useStore();
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [insured, setInsured] = useState("");

  if (commission.shipping) {
    const s = commission.shipping;
    return (
      <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
          Shipping
        </div>
        <div className="font-display text-base text-ink leading-tight">
          {s.carrier}
          {s.trackingNumber && (
            <>
              {" · "}
              <span className="font-mono text-sm">{s.trackingNumber}</span>
            </>
          )}
        </div>
        <div className="mt-1 font-sans text-xs text-ink-muted tabular-nums">
          Shipped {new Date(s.shippedAt).toLocaleDateString()}
          {s.insuredFor != null && ` · Insured for $${s.insuredFor.toLocaleString()}`}
        </div>
      </div>
    );
  }

  if (persona !== "artist") {
    return (
      <div className="rounded-md border border-dashed border-ink/15 p-5 sm:p-6">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
          Shipping
        </div>
        <p className="font-serif text-sm text-ink-muted">
          Awaiting the artist's shipping record. Tracking number will appear
          here once shipped.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
        Record shipping
      </div>
      <p className="font-serif text-sm text-ink-muted mb-3">
        Carrier + tracking. The patron is notified automatically. We strongly
        recommend insurance for any work over $1,000.
      </p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ship-carrier">Carrier</Label>
          <select
            id="ship-carrier"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
          >
            <option value="">Select carrier…</option>
            <option>FedEx</option>
            <option>UPS</option>
            <option>USPS</option>
            <option>DHL</option>
            <option>Hand-carry</option>
            <option>Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ship-tracking">Tracking number (optional)</Label>
          <Input
            id="ship-tracking"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. 1Z999AA1..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ship-insured">Insured for (USD, optional)</Label>
          <Input
            id="ship-insured"
            type="number"
            min={0}
            value={insured}
            onChange={(e) => setInsured(e.target.value)}
            placeholder="Declared value"
          />
        </div>
        <Button
          className="w-full"
          variant="outline"
          disabled={!carrier}
          onClick={() => {
            store.recordShipping(commission.id, {
              carrier,
              trackingNumber: tracking.trim() || undefined,
              insuredFor: insured ? Number(insured) : undefined,
            });
            setCarrier("");
            setTracking("");
            setInsured("");
          }}
        >
          Mark shipped
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// IP terms display — read-only for now in the prototype.
// ─────────────────────────────────────────────────────────────
function IpTermsBlock({ commission }: { commission: Commission; persona: Persona }) {
  const map: Record<string, { title: string; blurb: string }> = {
    "patron-exclusive": {
      title: "Patron-exclusive",
      blurb:
        "The patron owns the original and all reproduction rights. The artist may not sell prints or reproductions.",
    },
    "shared-prints": {
      title: "Shared prints",
      blurb:
        "Both parties may reproduce. The artist may sell limited-edition prints; the patron may reproduce for personal/devotional use.",
    },
    "artist-retains": {
      title: "Artist retains rights",
      blurb:
        "The patron owns the physical work. The artist retains all reproduction rights.",
    },
    "shared-custom": {
      title: "Custom terms",
      blurb: commission.ipCustomNote ?? "Negotiated terms recorded in the commission notes.",
    },
  };
  const t = commission.ipTerms ? map[commission.ipTerms] : map["patron-exclusive"];
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 p-5">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
        Reproduction rights
      </div>
      <div className="font-display text-base text-ink">{t.title}</div>
      <p className="mt-1 font-serif text-sm text-ink-soft leading-snug">
        {t.blurb}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dispute block — either party can open one
// ─────────────────────────────────────────────────────────────
function DisputeBlock({
  commission,
  persona,
}: {
  commission: Commission;
  persona: Persona;
}) {
  const store = useStore();
  const disputes = store.disputesForCommission(commission.id);
  const openDispute = disputes.find((d) => d.status === "open");
  const [opening, setOpening] = useState(false);
  const [reason, setReason] = useState("");

  if (openDispute) {
    return (
      <div className="rounded-md border border-burgundy-500/30 bg-burgundy-500/5 p-5">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-burgundy-500 mb-2">
          Dispute open
        </div>
        <p className="font-serif text-sm text-ink-soft leading-relaxed">
          Opened by the {openDispute.openedBy} on{" "}
          {new Date(openDispute.openedAt).toLocaleDateString()}: "
          {openDispute.reason}"
        </p>
        <p className="mt-2 font-sans text-xs italic text-ink-muted">
          A guild mediator will reach out within 48 hours. Held escrow funds
          are paused.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 p-5">
      {opening ? (
        <div className="space-y-3">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-burgundy-500">
            Open a dispute
          </div>
          <p className="font-serif text-sm text-ink-soft">
            Mediation is free and confidential. Describe what's wrong; a
            guild reader will follow up within 48 hours.
          </p>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What needs to be resolved?"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={!reason.trim()}
              onClick={() => {
                store.openDispute({
                  commissionId: commission.id,
                  openedBy: persona,
                  reason: reason.trim(),
                });
                setReason("");
                setOpening(false);
              }}
            >
              Open dispute
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpening(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-1">
              Need help?
            </div>
            <p className="font-serif text-sm text-ink-muted leading-snug">
              Open a dispute to bring in a guild mediator. Held funds pause
              until resolved.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => setOpening(true)}
          >
            Open dispute
          </Button>
        </div>
      )}
    </div>
  );
}
