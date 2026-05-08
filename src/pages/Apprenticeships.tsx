import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, GraduationCap, HandCoins, Users, Mail } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { initials } from "../lib/utils";

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
      <section className="bg-ink text-parchment-50 mt-24">
        <div className="container py-20 sm:py-24 max-w-3xl">
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
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="gold">
              <a href="mailto:apprenticeships@arssacra.local">
                <Mail className="h-4 w-4 mr-2" />
                Apply
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-parchment-50 border-parchment-50/40 hover:bg-parchment-50/10 hover:border-parchment-50/70">
              <Link to="/manifesto">Read the manifesto</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container my-20 max-w-2xl text-center">
        <Ornament className="my-8" />
        <p className="font-serif italic text-lg text-ink-muted leading-relaxed">
          "Master and apprentice — the two oldest words in the workshop."
        </p>
      </section>
    </PageShell>
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
