import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Info, ShieldCheck } from "lucide-react";
import { categories } from "../data/categories";
import type { VerifierRole } from "../types";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { classifyEmail } from "../lib/email-policy";
import { cn } from "../lib/utils";
import { brand } from "../data/brand";

const ROLES: Array<{ id: VerifierRole; label: string; help: string }> = [
  {
    id: "pastor",
    label: "Diocesan parish priest (pastor)",
    help: "Most artists. Your pastor at the parish where you regularly worship.",
  },
  {
    id: "religious-superior",
    label: "Religious superior",
    help: "For artists in religious life — abbot, abbess, prior, provincial.",
  },
  {
    id: "chaplain",
    label: "Chaplain or rector",
    help: "Military, hospital, university, prison, or seminary chaplain.",
  },
  {
    id: "chancery",
    label: "Diocesan chancery (no parish reachable)",
    help: "Use only if no pastor or superior is available. We'll contact the chancellor or vicar general.",
  },
];

export default function ArtistSignup() {
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [role, setRole] = useState<VerifierRole>("pastor");
  const [verifierEmail, setVerifierEmail] = useState("");
  const navigate = useNavigate();
  const { signUpArtist, submitVerification } = useStore();

  const emailClass = useMemo(
    () => classifyEmail(verifierEmail),
    [verifierEmail],
  );
  const showChanceryFields = emailClass.valid && emailClass.isFreeWebmail;

  function toggleCat(slug: string) {
    setSelectedCats((cur) =>
      cur.includes(slug) ? cur.filter((c) => c !== slug) : [...cur, slug],
    );
  }

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Apply to the guild
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          Apply to be vouched-for.
        </h1>
        <p className="mt-5 font-serif text-lg text-ink-muted leading-relaxed max-w-2xl">
          Every {brand.name} artist is endorsed by their pastor — or, for
          religious, by their superior. The guild does not list anonymous
          artists, and it does not list artists no priest will vouch for.
          That&rsquo;s the whole point.
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
            const v = submitVerification({
              role,
              verifierName: String(data.get("verifierName") || ""),
              verifierEmail: String(data.get("verifierEmail") || ""),
              parishOrCommunity: String(data.get("parishOrCommunity") || ""),
              parishWebsite:
                String(data.get("parishWebsite") || "") || undefined,
              diocese: String(data.get("diocese") || "") || undefined,
              chanceryEmail:
                String(data.get("chanceryEmail") || "") || undefined,
            });
            navigate(`/dashboard?just-applied=${v.token}`);
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
              <Field label="Your email">
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
                  <option value="welcome">
                    Welcome — I quote per request
                  </option>
                  <option value="tiers">Tiers only — no custom quotes</option>
                </select>
              </Field>
            </div>
            <p className="font-serif text-sm italic text-ink-muted">
              You will be invited to a private dashboard to set your full
              tiers, portfolio, and turnaround windows after the guild
              receives your endorsement.
            </p>
          </Section>

          <Section
            title="Pastor's endorsement"
            eyebrow="Five"
            extra={
              <div className="rounded-md border border-burgundy-500/20 bg-burgundy-500/5 p-4 text-sm text-ink-soft font-serif leading-relaxed">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-burgundy-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-medium text-ink">
                      How this works.
                    </strong>{" "}
                    We email your priest a one-click endorsement page. He
                    affirms you are a parishioner in good standing and that
                    he supports your work. His name and parish appear on
                    your profile. Re-confirmed annually. He may revoke at
                    any time.
                  </div>
                </div>
              </div>
            }
          >
            <Field label="Verifier's role">
              <div className="grid gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    aria-pressed={role === r.id}
                    className={cn(
                      "rounded-md border p-3 text-left transition-colors focusable",
                      role === r.id
                        ? "border-burgundy-500 bg-burgundy-500/5"
                        : "border-ink/10 bg-parchment-50 hover:border-ink/25",
                    )}
                  >
                    <div className="font-serif text-base text-ink">
                      {r.label}
                    </div>
                    <div className="mt-0.5 font-serif text-sm text-ink-muted">
                      {r.help}
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Verifier's name">
                <Input
                  name="verifierName"
                  required
                  placeholder={
                    role === "religious-superior"
                      ? "e.g. Abbot James Dunne"
                      : "e.g. Fr. John Smith"
                  }
                />
              </Field>
              <Field
                label={
                  role === "religious-superior"
                    ? "Community"
                    : role === "chancery"
                      ? "Chancery / Diocese"
                      : "Parish or chapel"
                }
              >
                <Input
                  name="parishOrCommunity"
                  required
                  placeholder="e.g. St. Mary's Parish, Pittsburgh PA"
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Parish/community website (recommended)">
                <Input
                  name="parishWebsite"
                  type="url"
                  placeholder="https://stmaryparish.org"
                />
              </Field>
              <Field label="Verifier's email">
                <Input
                  name="verifierEmail"
                  type="email"
                  required
                  value={verifierEmail}
                  onChange={(e) => setVerifierEmail(e.target.value)}
                  placeholder="fr.smith@stmaryparish.org"
                />
              </Field>
            </div>

            {showChanceryFields && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-md border border-gold-500/40 bg-gold-500/5 p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-gold-600 shrink-0 mt-1" />
                  <div className="space-y-3 grow">
                    <div>
                      <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-600 mb-1">
                        Free-webmail address ({emailClass.domain})
                      </div>
                      <p className="font-serif text-sm text-ink-soft leading-relaxed">
                        Many small parishes still use a free-webmail
                        account. We accept this — but the endorsement only
                        goes live once your{" "}
                        <strong className="font-medium">
                          diocesan chancery
                        </strong>{" "}
                        confirms. Most chanceries reply within a few
                        business days.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Diocese">
                        <Input
                          name="diocese"
                          required={showChanceryFields}
                          placeholder="Diocese of Pittsburgh"
                        />
                      </Field>
                      <Field label="Chancery email">
                        <Input
                          name="chanceryEmail"
                          type="email"
                          required={showChanceryFields}
                          placeholder="chancery@diopitt.org"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
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
          <p className="font-serif italic text-sm text-ink-muted">
            By submitting, you authorise the guild to contact your verifier
            and (if applicable) the chancery for the sole purpose of
            confirming you are a Catholic in good standing.
          </p>
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
  // Wrap the input in a <label> for implicit association — works with
  // screen readers without needing manual htmlFor/id wiring at every site.
  return (
    <Label className="block space-y-2">
      <span className="block">{label}</span>
      {children}
    </Label>
  );
}

function Section({
  title,
  eyebrow,
  extra,
  children,
}: {
  title: string;
  eyebrow: string;
  extra?: React.ReactNode;
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
      {extra}
      {children}
    </div>
  );
}
