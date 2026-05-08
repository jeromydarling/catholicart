import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { categories } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";

export default function ArtistSignup() {
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const { signUpArtist } = useStore();

  function toggleCat(slug: string) {
    setSelectedCats((cur) =>
      cur.includes(slug) ? cur.filter((c) => c !== slug) : [...cur, slug],
    );
  }

  if (submitted) {
    return (
      <PageShell>
        <section className="container py-16 sm:py-24 max-w-2xl text-center">
          <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-olive-500/15 text-olive-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-8 font-display text-4xl sm:text-5xl text-ink leading-tight">
            Thank you for applying.
          </h1>
          <p className="mt-4 font-serif text-lg text-ink-muted">
            A guild reader will read your application carefully and reply
            within two weeks. We accept artists slowly because we want each
            entry to mean something.
          </p>
          <Ornament className="my-10" />
          <Button asChild>
            <Link to="/dashboard">View your application</Link>
          </Button>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Apply to the guild
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          Become a member of the guild.
        </h1>
        <p className="mt-5 font-serif text-lg text-ink-muted leading-relaxed max-w-2xl">
          We accept artists who keep the rule of their craft and who can be
          vouched for by a master, a parish, or a body of completed work. We
          read every application; we will not waste your time.
        </p>
        <Ornament className="my-10" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            signUpArtist({
              name: String(data.get("name") || ""),
              email: String(data.get("email") || ""),
            });
            setSubmitted(true);
            window.scrollTo({ top: 0 });
          }}
          className="space-y-10"
        >
          <Section title="About you" eyebrow="One">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Your name">
                <Input name="name" required placeholder="As you sign work" />
              </Field>
              <Field label="Honorific (optional)">
                <Input
                  name="honorific"
                  placeholder="Br., Sr., Fr., Dr., etc."
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Email">
                <Input name="email" type="email" required />
              </Field>
              <Field label="City and country">
                <Input
                  name="location"
                  required
                  placeholder="e.g. Pittsburgh, USA"
                />
              </Field>
            </div>
          </Section>

          <Section title="Your craft" eyebrow="Two">
            <Label>Select all that apply</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((c) => {
                const active = selectedCats.includes(c.slug);
                return (
                  <button
                    type="button"
                    key={c.slug}
                    onClick={() => toggleCat(c.slug)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-md border p-4 text-left transition-colors focusable",
                      active
                        ? "border-burgundy-500 bg-burgundy-500/5 text-ink"
                        : "border-ink/10 bg-parchment-50 hover:border-ink/25 text-ink-soft",
                    )}
                  >
                    <div className="font-display text-lg leading-tight">
                      {c.shortName}
                    </div>
                    <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                      {c.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Your vocation" eyebrow="Three">
            <Field label="Vocation statement">
              <Textarea
                name="vocation"
                required
                rows={5}
                placeholder="A few sentences, in your own voice, on what you make and why. We use this verbatim on your profile."
              />
              <p className="mt-2 font-serif italic text-sm text-ink-muted">
                Plain prose. We are looking for clarity, not claims of
                greatness.
              </p>
            </Field>
            <Field label="Formation and training">
              <Textarea
                name="formation"
                rows={4}
                placeholder="Apprenticeships, schools, masters under whom you trained, communities you belong to."
              />
            </Field>
          </Section>

          <Section title="Pricing posture" eyebrow="Four">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Lowest tier — starting price (USD)">
                <Input
                  name="startingAt"
                  type="number"
                  min={0}
                  step={25}
                  required
                  placeholder="e.g. 540"
                />
              </Field>
              <Field label="Custom commissions">
                <select
                  name="customPricing"
                  className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 py-2 font-serif text-base text-ink focusable"
                  defaultValue="welcome"
                >
                  <option value="welcome">Welcome — I quote per request</option>
                  <option value="tiers">Tiers only — no custom quotes</option>
                </select>
              </Field>
            </div>
            <p className="font-serif text-sm italic text-ink-muted">
              You will be invited to a private dashboard to set your full
              tiers, portfolio, and turnaround windows after we accept you.
            </p>
          </Section>

          <Section title="A reference" eyebrow="Five">
            <Field label="Who can vouch for you?">
              <Textarea
                name="reference"
                rows={3}
                placeholder="A parish priest, a master, a former patron, a religious community. Name and contact, please."
              />
            </Field>
          </Section>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="pt-6 flex flex-wrap items-center gap-3"
          >
            <Button type="submit" size="lg">
              Submit application <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button asChild variant="link">
              <Link to="/manifesto">Read the manifesto first</Link>
            </Button>
          </motion.div>
        </form>
      </section>
    </PageShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 pb-8 border-b border-ink/10 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold-600">
          {eyebrow}
        </span>
        <span className="block h-px w-8 bg-gold-500/40" />
        <span className="font-display text-2xl text-ink">{title}</span>
      </div>
      {children}
    </div>
  );
}
