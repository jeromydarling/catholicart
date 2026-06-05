import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  PenLine,
  CircleDollarSign,
  Camera,
  ShieldCheck,
  Stamp,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { BrowserFrame } from "../components/marketing/BrowserFrame";
import { MiniVocation } from "../components/marketing/mini/MiniVocation";
import { MiniLetterFlow } from "../components/marketing/mini/MiniLetterFlow";
import { MiniWipFeed } from "../components/marketing/mini/MiniWipFeed";
import { MiniCertificate } from "../components/marketing/mini/MiniCertificate";

// /demo — a guided eight-step walkthrough of a commission, from
// browsing the guild to receiving the certificate. State lives in
// React (no API calls); the goal is to make the whole flow tangible
// enough that a visitor can show it to a friend.

interface Step {
  num: number;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  body: string;
  callout?: string;
  render: () => React.ReactNode;
}

export default function Demo() {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;
  const Icon = step.icon;

  return (
    <PageShell>
      <Seo
        title="Demo — walk through a commission"
        description="Eight steps from the letter to the certificate. A guided tour of how a commission actually unfolds on the guild."
        path="/demo"
      />

      <section className="container pt-12 sm:pt-16 max-w-5xl">
        <div className="flex items-center justify-between mb-2">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600">
            A guided walkthrough
          </div>
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted tabular-nums">
            {String(i + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </div>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          Commission a panel of St. Joseph.
        </h1>
        <p className="mt-3 font-serif text-base sm:text-lg text-ink-soft max-w-2xl">
          A pretend commission. No real money. Walk through the eight
          stages a real patron lives through — at the pace you choose.
        </p>

        {/* Stepper */}
        <div className="mt-8 grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {STEPS.map((s, idx) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setI(idx)}
              className="group block focusable"
              aria-label={`Step ${s.num} — ${s.title}`}
            >
              <div
                className={`h-1 rounded-full transition-colors ${
                  idx <= i ? "bg-burgundy-500" : "bg-ink/15"
                }`}
              />
              <div className="mt-1.5 font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted text-left hidden sm:block">
                {String(s.num).padStart(2, "0")}
              </div>
            </button>
          ))}
        </div>

        <Ornament className="my-10" />
      </section>

      {/* Step body */}
      <section className="container max-w-5xl pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-12 gap-10 items-start"
          >
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-burgundy-500 text-parchment-50">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
                  {step.eyebrow}
                </div>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
                {step.title}
              </h2>
              <p className="mt-4 font-serif text-lg text-ink-soft leading-relaxed">
                {step.body}
              </p>
              {step.callout && (
                <div className="mt-5 rounded-md border border-gold-500/30 bg-gold-500/5 p-4">
                  <div className="flex items-center gap-1.5 font-sans text-[9px] uppercase tracking-[0.18em] text-gold-600 mb-1">
                    <Sparkles className="h-2.5 w-2.5" /> Worth noticing
                  </div>
                  <p className="font-serif text-sm text-ink leading-snug">
                    {step.callout}
                  </p>
                </div>
              )}

              <div className="mt-8 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setI((n) => Math.max(0, n - 1))}
                  disabled={i === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                {isLast ? (
                  <Button asChild>
                    <Link to="/browse">
                      Begin a real commission{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="lg:col-span-7">{step.render()}</div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Footer rail */}
      <section className="container max-w-3xl pb-20">
        <div className="rounded-md border border-ink/10 bg-parchment-100/40 p-6 text-center">
          <p className="font-serif text-base text-ink-soft">
            Want the full picture?{" "}
            <Link to="/features" className="text-burgundy-500 hover:text-burgundy-600 underline underline-offset-2">
              See every feature
            </Link>{" "}
            or{" "}
            <Link to="/about" className="text-burgundy-500 hover:text-burgundy-600 underline underline-offset-2">
              read what we're for
            </Link>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}

// ─────────── The eight steps ───────────

const STEPS: Step[] = [
  {
    num: 1,
    eyebrow: "Step one · find the hand",
    icon: PenLine,
    title: "Read each artist's vocation.",
    body: "The guild is not a marketplace of strangers. Every artist has a public vocation site — a synthesized mission, a studio rhythm, a process note, and which feasts they're working toward this year. You read until one feels right.",
    callout:
      "The synthesized text comes from the JP2 questionnaire each artist fills out — ten questions in the spirit of John Paul II's Letter to Artists, run through Claude Sonnet 4.6.",
    render: () => (
      <BrowserFrame url="arssacra.com/sr-maria-chrysostom">
        <MiniVocation />
      </BrowserFrame>
    ),
  },
  {
    num: 2,
    eyebrow: "Step two · the pastor's endorsement",
    icon: ShieldCheck,
    title: "Endorsed by a pastor, not a quiz.",
    body: "Every guild artist is verified by a parish priest, a religious superior, or a chancery. The pastor gets one email, follows one link, clicks one button — no account needed. You see the endorsement on the artist's profile.",
    render: () => (
      <BrowserFrame url="arssacra.com/verify/...token">
        <div className="p-5">
          <div className="rounded-md border border-olive-500/30 bg-olive-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-olive-500 text-parchment-50">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-olive-600">
                  Pastor-endorsed
                </div>
                <div className="font-display text-lg text-ink leading-tight">
                  Fr. Tommaso Pecora
                </div>
                <div className="font-serif text-sm text-ink-soft">
                  Santa Maria del Carmine, Florence
                </div>
                <div className="mt-1 font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                  Endorsed · Sept 14, 2025
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 font-serif text-sm text-ink-soft italic">
            "Sister Maria has worked in our parish for twelve years. Her
            icons hang in the side chapel. I commend her without
            reservation."
          </p>
        </div>
      </BrowserFrame>
    ),
  },
  {
    num: 3,
    eyebrow: "Step three · the letter",
    icon: Mail,
    title: "Write a plain letter.",
    body: "Tell the artist about the saint, the season, the room, the recipient. Be specific. Be patient. The letter is not a brief — it's how a real conversation begins. The artist will answer with a vision before any price is named.",
    render: () => (
      <BrowserFrame url="arssacra.com/commission/new">
        <MiniLetterFlow />
      </BrowserFrame>
    ),
  },
  {
    num: 4,
    eyebrow: "Step four · the quote",
    icon: CircleDollarSign,
    title: "A price, plainly stated.",
    body: "The artist names a number. You decide. The artist keeps every cent of what you agree to — the 2% guild tithe is settled at the very end, not split across milestones.",
    callout:
      "Funds sit in escrow, never co-mingled with the guild's. Released only when you approve each milestone — deposit, midpoint, final.",
    render: () => (
      <BrowserFrame url="arssacra.com/workspace/joseph-panel#quote">
        <div className="p-5">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
            Quote · St. Joseph panel
          </div>
          <div className="font-display text-4xl text-ink tabular-nums">
            $2,400
          </div>
          <div className="mt-2 font-serif text-sm text-ink-muted">
            three months · delivered by Holy Saturday
          </div>
          <hr className="my-4 border-t border-ink/10" />
          <ol className="space-y-2 font-sans text-[12px]">
            <Milestone label="Deposit · on agreement" amount="$800" />
            <Milestone label="Midpoint · first study approved" amount="$800" />
            <Milestone label="Final · on delivery" amount="$800" />
          </ol>
          <hr className="my-4 border-t border-ink/10" />
          <div className="flex items-center justify-between font-sans text-[11px]">
            <span className="text-ink-muted uppercase tracking-[0.18em]">
              Guild tithe · settled at the end
            </span>
            <span className="text-ink tabular-nums">$48 · 2%</span>
          </div>
          <button className="mt-5 w-full rounded-sm bg-burgundy-500 px-3 py-2.5 font-sans text-xs uppercase tracking-[0.22em] text-parchment-50">
            Fund the deposit
          </button>
        </div>
      </BrowserFrame>
    ),
  },
  {
    num: 5,
    eyebrow: "Step five · the studio reel",
    icon: Camera,
    title: "Watch the work come together.",
    body: "Studio photos, captions, the gesso lifting, the underdrawing transferring, the first gold leaf burnishing. You're there for the making, even if you're a continent away.",
    render: () => (
      <BrowserFrame url="arssacra.com/workspace/joseph-panel#reel">
        <MiniWipFeed />
      </BrowserFrame>
    ),
  },
  {
    num: 6,
    eyebrow: "Step six · midpoint approval",
    icon: Check,
    title: "Approve before the next release.",
    body: "Halfway through the work, the artist sends a study. You approve it — or you ask for a small turn. Only then does the second milestone release from escrow.",
    render: () => (
      <BrowserFrame url="arssacra.com/workspace/joseph-panel#midpoint">
        <div className="p-5">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
            Midpoint study · awaiting your approval
          </div>
          <div
            className="aspect-[4/3] w-full rounded-sm"
            style={{
              background:
                "linear-gradient(135deg, #a4956e 0%, #665a3e 60%, #2a2010 100%)",
            }}
            aria-hidden
          />
          <p className="mt-3 font-serif text-sm text-ink-soft italic">
            "The cartoon transferred clean. Joseph's hands gave the
            longest trouble — second attempt felt right. I'm ready for
            your nod before I move into color."
          </p>
          <div className="mt-4 flex gap-2">
            <button className="grow rounded-sm bg-olive-500 px-3 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-parchment-50">
              Approve · release $800
            </button>
            <button className="rounded-sm border border-ink/15 bg-parchment-50 px-3 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Ask for a turn
            </button>
          </div>
        </div>
      </BrowserFrame>
    ),
  },
  {
    num: 7,
    eyebrow: "Step seven · the certificate",
    icon: Stamp,
    title: "Provenance, sewn in.",
    body: "Each finished work ships with a printed certificate: your letter, the artist's vision, the studio timeline, the artist's signature line. So in fifty years someone can pick the panel up and know its story.",
    render: () => (
      <BrowserFrame url="arssacra.com/certificate/joseph-panel">
        <MiniCertificate />
      </BrowserFrame>
    ),
  },
  {
    num: 8,
    eyebrow: "Step eight · received",
    icon: PartyPopper,
    title: "And the work is yours.",
    body: "The crate arrives. You unwrap a real thing made by a real human being for the people of God. The guild has done its part; the rest is between you and the wall.",
    callout:
      "If you opt in, your letter and the artist's vision can join the public archive — so the next patron can see how it's done.",
    render: () => (
      <BrowserFrame url="arssacra.com/orders/joseph-panel">
        <div className="p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-500 text-parchment-50">
            <PartyPopper className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-2xl text-ink">
            Delivered · Holy Saturday
          </h3>
          <p className="mt-2 font-serif text-sm text-ink-soft">
            St. Joseph at the Bench is now hanging above your son's
            crib. The artist has been paid. The 2% tithe was settled at
            release.
          </p>
          <hr className="my-4 border-t border-ink/10" />
          <div className="grid grid-cols-3 gap-3 text-left">
            <Tot label="Artist received" value="$2,400" />
            <Tot label="Guild tithe" value="$48" muted />
            <Tot label="Apprentices fund" value="$24" muted />
          </div>
          <button className="mt-5 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 py-2.5 font-sans text-[11px] uppercase tracking-[0.18em] text-ink">
            Share the letter publicly
          </button>
        </div>
      </BrowserFrame>
    ),
  },
];

function Milestone({ label, amount }: { label: string; amount: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="text-ink tabular-nums">{amount}</span>
    </li>
  );
}

function Tot({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </div>
      <div
        className={`mt-0.5 font-display text-base tabular-nums ${
          muted ? "text-ink-soft" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
