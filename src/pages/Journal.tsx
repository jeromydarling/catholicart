import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { notify } from "../lib/email/notify";
import { Seo } from "../components/Seo";

interface Issue {
  number: number;
  season: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  date: string;
  paletteFrom: string;
  paletteTo: string;
}

const ISSUES: Issue[] = [
  {
    number: 4,
    season: "Eastertide 2026",
    title: "On Looking at the Body",
    excerpt:
      "Catholic art is not, first, an art of ideas. It is an art of bodies — the broken body on the cross, the glorified body of the resurrection, the pierced body of the saint. The argument of this issue is that to lose the body is to lose the faith.",
    author: "Mary Beauchamp",
    authorRole: "editor",
    date: "Apr 2026",
    paletteFrom: "#a52f2f",
    paletteTo: "#3a0d0d",
  },
  {
    number: 3,
    season: "Lent 2026",
    title: "The Long Apprenticeship",
    excerpt:
      "Most of what is called 'Catholic artistic decline' is actually a labor problem. The hand was never trained. The eye was never disciplined. The vocation was never named. We propose a thirty-year horizon and a sober one.",
    author: "Br. Andrew of Subiaco, OSB",
    authorRole: "contributor",
    date: "Feb 2026",
    paletteFrom: "#553c5e",
    paletteTo: "#1a0e25",
  },
  {
    number: 2,
    season: "Advent 2025",
    title: "Patrons, Not Customers",
    excerpt:
      "There is a moral difference between commissioning a work and buying a product. The first is an act of friendship; the second, of consumption. The Church needs more friends of art and fewer of its consumers.",
    author: "Theo Marchand, OP",
    authorRole: "contributor",
    date: "Dec 2025",
    paletteFrom: "#3a4d8f",
    paletteTo: "#0e1840",
  },
  {
    number: 1,
    season: "Ordinary Time 2025",
    title: "Why a Guild?",
    excerpt:
      "We could have made a marketplace. We made a guild instead. Here is why: a marketplace selects for what sells; a guild selects for what is true. The two converge only sometimes, and we have decided which side we are on.",
    author: "The editors",
    authorRole: "editorial",
    date: "Sep 2025",
    paletteFrom: "#5d6f3d",
    paletteTo: "#1f2a11",
  },
];

const FEATURED = ISSUES[0];
const ARCHIVE = ISSUES.slice(1);

export default function Journal() {
  return (
    <PageShell>
      <Seo
        title="The Beauty Manifesto — quarterly journal"
        description="Long-form essays from artists, patrons, theologians, and the occasional bishop. Published four times a year. Free in the mail to anyone who asks."
        path="/journal"
      />
      <section className="container pt-12 sm:pt-16 max-w-5xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          The Beauty Manifesto · Quarterly
        </div>
        <h1
          className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] tracking-tight text-ink leading-[0.95]"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          A journal for those who refuse to <span className="italic text-burgundy-500">lose</span> the war on beauty.
        </h1>
        <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft max-w-2xl leading-relaxed">
          Long-form essays from artists, patrons, theologians, and the
          occasional bishop. Published four times a year. Sent in the mail
          to anyone who asks.
        </p>
        <Ornament className="my-10" />
      </section>

      {/* Featured issue */}
      <section className="container max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <IssueCover issue={FEATURED} large />
          </motion.div>
          <div className="lg:col-span-7">
            <div className="font-sans text-[11px] uppercase tracking-[0.32em] text-burgundy-500">
              Current issue · No. {FEATURED.number} · {FEATURED.season}
            </div>
            <h2
              className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-tight"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              {FEATURED.title}
            </h2>
            <p className="mt-5 font-serif text-lg sm:text-xl text-ink-soft leading-relaxed">
              {FEATURED.excerpt}
            </p>
            <div className="mt-8 font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
              By {FEATURED.author} · {FEATURED.authorRole}
            </div>
            <Link
              to="#"
              className="mt-6 inline-flex items-center font-sans text-sm uppercase tracking-[0.22em] text-burgundy-500 hover:text-burgundy-600"
            >
              Read the issue <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Archive */}
      <section className="container mt-24 sm:mt-32 max-w-6xl">
        <div className="flex items-baseline justify-between gap-4 flex-wrap mb-10">
          <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
            From the archive
          </h2>
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            {ARCHIVE.length} earlier issues
          </div>
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARCHIVE.map((issue, i) => (
            <motion.li
              key={issue.number}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link to="#" className="group block focusable">
                <IssueCover issue={issue} />
                <div className="mt-4">
                  <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                    No. {issue.number} · {issue.season}
                  </div>
                  <h3 className="mt-1 font-display text-xl text-ink leading-tight group-hover:text-burgundy-500 transition-colors">
                    {issue.title}
                  </h3>
                  <p className="mt-2 font-serif text-sm text-ink-soft line-clamp-3 leading-snug">
                    {issue.excerpt}
                  </p>
                  <div className="mt-3 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                    {issue.author}
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Subscribe */}
      <SubscribeBlock />
    </PageShell>
  );
}

function SubscribeBlock() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <section className="container my-24 sm:my-32 max-w-2xl text-center">
      <Ornament className="my-8" />
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-olive-500/15 text-olive-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-display text-3xl sm:text-4xl text-ink leading-tight">
              You're on the list.
            </h2>
            <p className="mt-3 font-serif text-base text-ink-muted">
              The next issue will land at{" "}
              <strong className="text-ink">{submitted}</strong>. We send four
              times a year. Nothing else.
            </p>
            <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              Prototype · no email is sent
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
              Get it in the mail.
            </h2>
            <p className="mt-3 font-serif text-base text-ink-muted">
              Free to anyone who asks. Print run is small; tell a friend.
            </p>
            <form
              className="mt-8 flex gap-2 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const email = String(fd.get("email") || "");
                if (email) {
                  notify({ kind: "subscribe.journal", email });
                  setSubmitted(email);
                }
              }}
            >
              <label htmlFor="journal-subscribe-email" className="sr-only">
                Email address
              </label>
              <input
                id="journal-subscribe-email"
                name="email"
                type="email"
                required
                placeholder="your address"
                autoComplete="email"
                className="flex h-12 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm placeholder:text-ink-muted focusable"
              />
              <button
                type="submit"
                className="h-12 rounded-sm bg-burgundy-500 px-5 font-sans text-sm font-medium text-parchment-50 hover:bg-burgundy-600 focusable"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              Prototype · no email is sent
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function IssueCover({ issue, large }: { issue: Issue; large?: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-md shadow-card border border-ink/10"
      style={{
        background: `linear-gradient(135deg, ${issue.paletteFrom}, ${issue.paletteTo})`,
        aspectRatio: large ? "5 / 7" : "3 / 4",
      }}
    >
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
        }}
        aria-hidden
      />
      <div className="absolute inset-3 border border-parchment-50/15" aria-hidden />
      <div className="absolute inset-0 grid place-items-center text-parchment-50/85">
        <BookOpen className={large ? "h-20 w-20" : "h-14 w-14"} strokeWidth={1.2} />
      </div>
      <div className="absolute inset-x-0 top-0 p-5 text-parchment-50">
        <div className="font-sans text-[10px] uppercase tracking-[0.32em] opacity-85">
          The Beauty Manifesto · No. {issue.number}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-parchment-50">
        <div
          className={`font-display italic ${large ? "text-3xl sm:text-4xl" : "text-xl"} leading-tight tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]`}
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {issue.title}
        </div>
        <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] opacity-85">
          {issue.season} · {issue.date}
        </div>
      </div>
    </div>
  );
}
