import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Building2, Crown, FileText, Mail, ShieldCheck } from "lucide-react";
import { listDioceses } from "../data/artist-tags";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useStore } from "../lib/store";
import { formatPrice } from "../lib/utils";

export default function Partnerships() {
  const dioceses = listDioceses();
  const { intakes, proposals } = useStore();
  const openIntakes = intakes.filter((i) => i.status === "open" || i.status === "shortlisting");
  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          For dioceses & religious orders
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          Partner with the guild.
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl leading-relaxed">
          Furnish a parish. Outfit a chapel. Adorn a cathedral. We build
          custom ledgers for dioceses, religious communities, and Catholic
          institutions — vetted artists, joint endorsement, joint
          stewardship.
        </p>
        <Ornament className="my-10" />
      </section>

      {/* Submit a brief CTA */}
      <section className="container mb-16">
        <div className="rounded-md border border-burgundy-500/30 bg-gradient-to-br from-parchment-50 to-burgundy-500/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-burgundy-500/10 text-burgundy-500">
            <FileText className="h-6 w-6" />
          </div>
          <div className="grow">
            <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
              Post a brief. Receive proposals from the guild.
            </h2>
            <p className="mt-2 font-serif text-base text-ink-muted leading-relaxed max-w-2xl">
              For bulk and multi-stakeholder commissions: one description, an
              approval chain, NET-30 invoicing, and proposals from artists vetted
              for the work.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/partnerships/new">
              Submit an institutional brief <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Open RFPs */}
      {openIntakes.length > 0 && (
        <section className="container mb-20">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
            Open RFPs
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight mb-8">
            Briefs accepting proposals
          </h2>
          <ul className="grid lg:grid-cols-2 gap-5">
            {openIntakes.map((i) => {
              const intakeProposals = proposals.filter((p) => p.intakeId === i.id);
              return (
                <li key={i.id}>
                  <Link
                    to={`/partnerships/${i.id}`}
                    className="block rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6 hover:shadow-plate transition-shadow focusable"
                  >
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                        {i.diocese ?? i.institutionName}
                      </div>
                      <Badge variant={i.status === "open" ? "gold" : "lapis"}>
                        {i.status === "open" ? "Open" : "Shortlisting"}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-display text-xl text-ink leading-tight">
                      {i.title}
                    </h3>
                    <p className="mt-3 font-serif text-sm text-ink-soft leading-relaxed line-clamp-3">
                      {i.brief}
                    </p>
                    <dl className="mt-4 grid grid-cols-3 gap-3 font-sans text-xs">
                      <Field label="Works">{i.quantity}</Field>
                      <Field label="Total budget">{i.budgetTotalUsd ? formatPrice(i.budgetTotalUsd) : "—"}</Field>
                      <Field label="Proposals">{intakeProposals.length}</Field>
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Three offerings */}
      <section className="container">
        <div className="grid md:grid-cols-3 gap-5">
          <Offering
            icon={<Crown className="h-5 w-5" />}
            title="Episcopal commissions"
            body="A bishop or chancery sets a scope (cathedra restoration, liturgical vestments, an altarpiece) and we marshal the right artists, with episcopal sign-off at every milestone."
          />
          <Offering
            icon={<Building2 className="h-5 w-5" />}
            title="Diocesan registries"
            body="We give your chancery a private registry of guild-vetted artists in your diocese — pre-cleared for parish commissions. No more shopping for kitsch on Etsy."
          />
          <Offering
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Order collections"
            body="Religious communities (Benedictines, Franciscans, Dominicans, etc.) curate a public collection of works from artists in their tradition — the seamless garment, made visible."
          />
        </div>
      </section>

      {/* Existing dioceses we already have artists in */}
      <section className="container mt-20 sm:mt-28">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-3">
          Already represented in
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
          {dioceses.length} dioceses across {countContinents(dioceses.length)} continents.
        </h2>
        <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dioceses.map((d, i) => (
            <motion.li
              key={d.diocese}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              className="rounded-md border border-ink/10 bg-parchment-50 px-4 py-3 flex items-center justify-between gap-3"
            >
              <span className="font-display text-base text-ink truncate">
                {d.diocese}
              </span>
              <Badge variant="lapis" className="tabular-nums shrink-0">
                {d.count}
              </Badge>
            </motion.li>
          ))}
        </ul>
        <Button asChild variant="outline" size="sm" className="mt-6">
          <Link to="/map">
            See the full map <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </section>

      {/* CTA */}
      <section className="container my-20 sm:my-28 max-w-2xl text-center">
        <Ornament className="my-8" />
        <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
          Begin the conversation.
        </h2>
        <p className="mt-3 font-serif text-base text-ink-muted">
          Write to the guild's chancellor. We'll bring a few names to the
          table within a week.
        </p>
        <Button asChild size="lg" className="mt-8">
          <a href="mailto:partnerships@arssacra.local">
            <Mail className="h-4 w-4 mr-2" />
            partnerships@arssacra.local
          </a>
        </Button>
      </section>
    </PageShell>
  );
}

function Offering({
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

function countContinents(_n: number) {
  return 4;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-base text-ink tabular-nums">{children}</dd>
    </div>
  );
}
