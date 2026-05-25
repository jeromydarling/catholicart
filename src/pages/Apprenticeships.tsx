import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle2, GraduationCap, HandCoins, Mail, Users } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { categories } from "../data/categories";
import { artists } from "../data/artists";
import { useStore } from "../lib/store";
import { initials } from "../lib/utils";
import type { CategorySlug } from "../types";

interface Grantee {
  name: string;
  craft: string;
  with: string;       // "with [Master]"
  city: string;
  amount: number;
  year: number;
  note: string;
  paletteFrom: string;
  paletteTo: string;
}

const GRANTEES: Grantee[] = [
  {
    name: "Therese Buckley",
    craft: "Iconography",
    with: "with Annunciata Park",
    city: "Pittsburgh, PA",
    amount: 18000,
    year: 2026,
    note: "Three years of egg tempera and gold leaf, formed inside Annunciata's studio.",
    paletteFrom: "#d8c39a",
    paletteTo: "#7a5320",
  },
  {
    name: "Jonas Riley",
    craft: "Sculpture",
    with: "with Felix Donnegan",
    city: "Charleston, SC",
    amount: 22000,
    year: 2026,
    note: "Wood and bronze. Apprenticed for the carving of altarpieces and processional crucifixes.",
    paletteFrom: "#b27840",
    paletteTo: "#3a1f0a",
  },
  {
    name: "Cecilia Aguirre",
    craft: "Sacred painting",
    with: "with Bartolomeu Camara",
    city: "São Paulo, BR",
    amount: 16000,
    year: 2026,
    note: "Oil and tempera in the Brazilian Baroque tradition. Two years.",
    paletteFrom: "#a52f2f",
    paletteTo: "#3a0d0d",
  },
  {
    name: "Br. Maximilian Roe, OSB",
    craft: "Liturgical metalwork",
    with: "with Br. Andrew of Subiaco",
    city: "Subiaco, NM",
    amount: 12000,
    year: 2025,
    note: "Chalices, ciboria, monstrances. The slow study of fire.",
    paletteFrom: "#3a352c",
    paletteTo: "#0e0c08",
  },
];

export default function Apprenticeships() {
  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-5xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Apprenticeship grants
        </div>
        <h1
          className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] tracking-tight text-ink leading-[0.95]"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          The hand is taught by <span className="italic text-burgundy-500">another hand</span>.
        </h1>
        <p className="mt-6 font-serif text-lg sm:text-xl text-ink-soft max-w-2xl leading-relaxed">
          We pay young artists a stipend to spend two or three years inside
          a master's studio. No degree. No tuition. The old way. Funded by a
          flat 1% of every commission.
        </p>
        <Ornament className="my-10" />
      </section>

      {/* Three pillars */}
      <section className="container">
        <div className="grid md:grid-cols-3 gap-5">
          <Pillar
            icon={<GraduationCap className="h-5 w-5" />}
            title="Two to three years."
            body="An apprenticeship is not a class. It is a long obedience inside another person's vocation. We fund the duration."
          />
          <Pillar
            icon={<HandCoins className="h-5 w-5" />}
            title="$12,000–$25,000 a year."
            body="Stipend covers rent, materials, travel. We are not Yale. We do pay enough to live."
          />
          <Pillar
            icon={<Users className="h-5 w-5" />}
            title="Funded by you."
            body="One percent of every commission goes to the apprenticeship fund. Patrons train the next master, every time they hire the current one."
          />
        </div>
      </section>

      {/* Current grantees */}
      <section className="container mt-24 sm:mt-32 max-w-6xl">
        <div className="flex items-baseline justify-between gap-4 flex-wrap mb-10">
          <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
            Current apprentices
          </h2>
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted tabular-nums">
            {GRANTEES.length} hands · {GRANTEES.reduce((s, g) => s + g.amount, 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} this year
          </div>
        </div>
        <ul className="grid sm:grid-cols-2 gap-5">
          {GRANTEES.map((g, i) => (
            <motion.li
              key={g.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden"
            >
              <div
                className="aspect-[5/3] relative"
                style={{ background: `linear-gradient(135deg, ${g.paletteFrom}, ${g.paletteTo})` }}
              >
                <div
                  className="absolute inset-0 opacity-30 mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-parchment-50/15 ring-1 ring-parchment-50/30">
                    <span className="font-display text-2xl text-parchment-50">
                      {initials(g.name)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-display text-xl text-ink leading-tight">
                    {g.name}
                  </h3>
                  <Badge variant="gold">
                    {g.amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                    /yr
                  </Badge>
                </div>
                <div className="mt-1 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  {g.craft} · {g.with} · {g.city}
                </div>
                <p className="mt-3 font-serif text-sm text-ink-soft leading-relaxed">
                  {g.note}
                </p>
                <div className="mt-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                  Class of {g.year}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Apply */}
      <ApplySection />

      <section className="container my-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "Master and apprentice — the two oldest words in the workshop."
        </p>
      </section>
    </PageShell>
  );
}

function ApplySection() {
  const { submitApprenticeship } = useStore();
  const [submitted, setSubmitted] = useState<null | { name: string }>(null);

  return (
    <section className="bg-ink text-parchment-50 mt-24">
      <div className="container py-20 sm:py-24 max-w-3xl">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-gold-500/20 text-gold-300">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2
                className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Received, {submitted.name.split(" ")[0]}.
              </h2>
              <p className="mt-6 font-serif text-lg text-parchment-100 leading-relaxed max-w-2xl mx-auto">
                We read every application. If your craft and a master line up,
                we'll write back inside three weeks. If not, we'll tell you so
                you can keep looking.
              </p>
              <p className="mt-8 font-sans text-[10px] uppercase tracking-[0.22em] text-parchment-100/60">
                Prototype · no email is sent
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h2
                className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Apply, propose, recommend.
              </h2>
              <p className="mt-6 font-serif text-lg text-parchment-100 leading-relaxed">
                Three ways to begin. Apprentices apply. Masters propose
                apprentices they want to teach. Pastors recommend the talented
                young person they know. We read everything.
              </p>

              <form
                className="mt-10 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  const name = String(d.get("name") || "");
                  submitApprenticeship({
                    applicantName: name,
                    applicantEmail: String(d.get("email") || ""),
                    applicantAge: d.get("age") ? Number(d.get("age")) : undefined,
                    craft: String(d.get("craft") || "sacred-painting") as CategorySlug,
                    desiredMasterSlug: String(d.get("master") || "") || undefined,
                    parishOrCommunity: String(d.get("parish") || "") || undefined,
                    pastorEmail: String(d.get("pastorEmail") || "") || undefined,
                    portfolioUrl: String(d.get("portfolio") || "") || undefined,
                    letter: String(d.get("letter") || ""),
                  });
                  setSubmitted({ name });
                  window.scrollTo({ top: 0 });
                }}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <DarkField label="Your name">
                    <Input name="name" required placeholder="Full name" />
                  </DarkField>
                  <DarkField label="Your email">
                    <Input name="email" type="email" required placeholder="you@email.org" />
                  </DarkField>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <DarkField label="Your age (optional)">
                    <Input name="age" type="number" min={14} max={99} placeholder="e.g. 23" />
                  </DarkField>
                  <DarkField label="The craft">
                    <select
                      name="craft"
                      required
                      defaultValue="sacred-painting"
                      className="flex h-11 w-full rounded-sm border border-parchment-50/30 bg-parchment-50/10 text-parchment-50 px-3 font-sans text-sm focusable"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug} className="text-ink">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </DarkField>
                </div>
                <DarkField label="A master you'd like to apprentice with (optional)">
                  <select
                    name="master"
                    defaultValue=""
                    className="flex h-11 w-full rounded-sm border border-parchment-50/30 bg-parchment-50/10 text-parchment-50 px-3 font-sans text-sm focusable"
                  >
                    <option value="" className="text-ink">No preference — match me</option>
                    {artists.map((a) => (
                      <option key={a.slug} value={a.slug} className="text-ink">
                        {a.honorific ? `${a.honorific} ` : ""}
                        {a.name} · {a.city}
                      </option>
                    ))}
                  </select>
                </DarkField>
                <div className="grid sm:grid-cols-2 gap-4">
                  <DarkField label="Your parish or community (optional)">
                    <Input name="parish" placeholder="e.g. St. Cecilia's, Cleveland OH" />
                  </DarkField>
                  <DarkField label="Pastor's email (optional)">
                    <Input name="pastorEmail" type="email" placeholder="pastor@parish.org" />
                  </DarkField>
                </div>
                <DarkField label="Portfolio URL (optional)">
                  <Input name="portfolio" type="url" placeholder="https://… or instagram.com/…" />
                </DarkField>
                <DarkField label="Letter">
                  <Textarea
                    name="letter"
                    required
                    rows={6}
                    placeholder="In your own words. Why this craft, why now, what you'd give up to learn it. We read every word."
                  />
                </DarkField>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button type="submit" size="lg" variant="gold">
                    <Mail className="h-4 w-4 mr-2" /> Submit application
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-transparent text-parchment-50 border-parchment-50/40 hover:bg-parchment-50/10 hover:border-parchment-50/70">
                    <Link to="/manifesto">Read the manifesto</Link>
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function DarkField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Label className="block space-y-1.5 text-parchment-100">
      <span className="block font-sans text-xs uppercase tracking-[0.18em] text-parchment-100/70">
        {label}
      </span>
      {children}
    </Label>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-6 sm:p-7"
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-burgundy-500/10 text-burgundy-500">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-2xl text-ink leading-tight">
        {title}
      </h3>
      <p className="mt-2 font-serif text-base text-ink-soft leading-relaxed">
        {body}
      </p>
    </motion.div>
  );
}

ArrowRight; // keep import live
