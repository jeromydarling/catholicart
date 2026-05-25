import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Building2, Crown, ShieldCheck, Mail } from "lucide-react";
import { listDioceses } from "../data/artist-tags";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function Partnerships() {
  const dioceses = listDioceses();
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
  // Seed dioceses span North America (Pittsburgh, Santa Fe, Mexico),
  // South America (Recife), Europe (Tivoli, Plymouth, Galway, Oslo,
  // Lyon, Edinburgh, Granada), and Asia (Seoul).
  return 4;
}
