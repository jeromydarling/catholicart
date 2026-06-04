import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Award, Calendar, CheckCircle2, Eye } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { formatPrice } from "../lib/utils";
import { Seo } from "../components/Seo";

interface PastWinner {
  year: number;
  title: string;
  artist: string;
  city: string;
  category: string;
  citation: string;
  paletteFrom: string;
  paletteTo: string;
}

const WINNERS: PastWinner[] = [
  {
    year: 2025,
    title: "Processional Crucifix in Cherry",
    artist: "Felix Donnegan",
    city: "Charleston, SC",
    category: "Sculpture",
    citation:
      "For a body so plainly carved that it disarms all sentimentality. The grain runs with the wounds.",
    paletteFrom: "#8a5028",
    paletteTo: "#3a200a",
  },
  {
    year: 2024,
    title: "Annunciation Triptych",
    artist: "Annunciata Park",
    city: "Pittsburgh, PA",
    category: "Iconography",
    citation:
      "For an icon that holds the gaze of the Theotokos and refuses to flinch.",
    paletteFrom: "#3a4d8f",
    paletteTo: "#0e1840",
  },
  {
    year: 2023,
    title: "Our Lady of the Andes",
    artist: "Esteban Vega Cruz",
    city: "Mexico City, MX",
    category: "Sacred painting",
    citation:
      "For uniting the Mestiza Madonna with the working hand of the laborer who knelt before her.",
    paletteFrom: "#2e6b6b",
    paletteTo: "#0e2929",
  },
];

const PURSE = 25000;

export default function Prize() {
  return (
    <PageShell>
      <Seo
        title="The Pulchritudo Prize — $25,000, awarded each Pentecost"
        description="An annual prize for the most beautiful sacred work commissioned through Ars Sacra. Selected by a jury of artists, theologians, and the patron whose commission preceded the work."
        path="/prize"
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-gold-500/20 via-parchment-50 to-burgundy-500/10"
          aria-hidden
        />
        <div className="relative container py-20 sm:py-28 max-w-5xl">
          <div className="font-sans text-[11px] uppercase tracking-[0.32em] text-gold-600 mb-4">
            Pulchritudo Prize · Annual
          </div>
          <h1
            className="font-display text-5xl sm:text-7xl lg:text-[6rem] tracking-tight text-ink leading-[0.92]"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            One prize. <span className="italic text-burgundy-500">{formatPrice(PURSE)}</span>. The most
            beautiful sacred work commissioned this year.
          </h1>
          <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft max-w-2xl leading-relaxed">
            Awarded each Pentecost. Selected by a jury of artists, theologians,
            and the patron whose commission preceded the work. The purse goes
            to the artist; a {formatPrice(PURSE / 5)} bursary goes to their
            apprentice.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#nominate">
                Nominate a work <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/catalog">See this year's catalog</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Criteria */}
      <section className="container py-16 sm:py-20 max-w-5xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          The criteria
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
          We are looking for one thing — and it is hard to fake.
        </h2>
        <ul className="mt-10 grid md:grid-cols-3 gap-5">
          <Criterion
            icon={<Eye className="h-5 w-5" />}
            title="The work was looked at."
            body="The artist was patient. They studied. They corrected. The work shows that someone was actually there."
          />
          <Criterion
            icon={<Award className="h-5 w-5" />}
            title="The work was commissioned."
            body="No speculative pieces. The work was made for someone — a parish, a family, a monastery — and the commission is on file in The Ledger."
          />
          <Criterion
            icon={<Calendar className="h-5 w-5" />}
            title="The work served its hour."
            body="It was delivered, blessed, and put into liturgical use. We do not award gallery objects. We award altars, icons, vestments, songs, and the like."
          />
        </ul>
      </section>

      {/* Past winners */}
      <section className="bg-ink text-parchment-50">
        <div className="container py-20 sm:py-24">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-300 mb-3">
            Past laureates
          </div>
          <h2
            className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] max-w-4xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            What we've named beautiful, so far.
          </h2>
          <ul className="mt-12 grid md:grid-cols-3 gap-5">
            {WINNERS.map((w, i) => (
              <motion.li
                key={w.year}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-md overflow-hidden border border-parchment-50/15"
              >
                <div
                  className="aspect-[4/5] relative"
                  style={{ background: `linear-gradient(135deg, ${w.paletteFrom}, ${w.paletteTo})` }}
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
                    <Award className="h-20 w-20" strokeWidth={1.2} />
                  </div>
                  <div className="absolute inset-x-0 top-0 p-5">
                    <Badge variant="gold" className="tabular-nums">
                      {w.year}
                    </Badge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div
                      className="font-display italic text-2xl leading-tight tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] text-parchment-50"
                      style={{ textWrap: "balance" } as React.CSSProperties}
                    >
                      {w.title}
                    </div>
                    <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] opacity-80 text-parchment-50">
                      {w.category} · {w.city}
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-parchment-50/5">
                  <div className="font-display text-lg text-parchment-50">
                    {w.artist}
                  </div>
                  <p className="mt-2 font-serif italic text-sm text-parchment-100/80 leading-relaxed">
                    "{w.citation}"
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Nominate */}
      <NominateSection />


      <section className="container my-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "Pulchritudo tam antiqua et tam nova." — Augustine
        </p>
        <div className="mt-2 font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
          Beauty, so old and so new
        </div>
      </section>
    </PageShell>
  );
}

function NominateSection() {
  const [submitted, setSubmitted] = useState<null | { name: string }>(null);
  return (
    <section id="nominate" className="container my-24 max-w-3xl">
      <Ornament className="my-8" />
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-olive-500/15 text-olive-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-display text-3xl sm:text-4xl text-ink leading-tight">
              Thank you, {submitted.name.split(" ")[0] || "friend"}.
            </h2>
            <p className="mt-3 font-serif text-base text-ink-muted max-w-xl mx-auto">
              Your nomination is with the jury. We meet quarterly; the
              laureate is announced at Pentecost. Every serious entry is
              read.
            </p>
            <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              Prototype · no nomination is sent
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
            <div className="text-center">
              <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
                Nominate a work for {new Date().getFullYear()}.
              </h2>
              <p className="mt-3 font-serif text-base text-ink-muted max-w-xl mx-auto">
                Anyone can nominate any work in The Ledger. Self-nominations
                are welcome. The jury reads all serious entries.
              </p>
            </div>
            <form
              className="mt-10 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                setSubmitted({ name: String(fd.get("name") || "") });
              }}
            >
              <Field name="name" label="Your name" placeholder="Full name" required />
              <Field name="email" label="Your email" placeholder="email@parish.org" type="email" required />
              <Field name="work" label="Work you're nominating" placeholder="Title or commission ID" full required />
              <Field
                name="reason"
                label="Why this work"
                placeholder="A few sentences. The jury reads what you write."
                full
                textarea
                required
              />
              <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2">
                <Button type="submit" size="lg">
                  Send nomination <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
            <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted text-center">
              Prototype · no nomination is sent
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Criterion({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-6"
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-500/15 text-gold-600">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl text-ink leading-tight">
        {title}
      </h3>
      <p className="mt-2 font-serif text-base text-ink-soft leading-relaxed">
        {body}
      </p>
    </motion.li>
  );
}

function Field({
  label,
  placeholder,
  type,
  full,
  textarea,
  name,
  required,
}: {
  label: string;
  placeholder: string;
  type?: string;
  full?: boolean;
  textarea?: boolean;
  name?: string;
  required?: boolean;
}) {
  const id = `prize-${name ?? label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label
        htmlFor={id}
        className="font-sans text-xs font-medium text-ink-soft tracking-wide"
      >
        {label}
        {required && <span aria-hidden className="text-burgundy-500"> *</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={4}
          className="flex w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 py-2 font-serif text-sm placeholder:text-ink-muted focusable"
        />
      ) : (
        <input
          id={id}
          name={name}
          required={required}
          type={type ?? "text"}
          placeholder={placeholder}
          className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm placeholder:text-ink-muted focusable"
        />
      )}
    </div>
  );
}
