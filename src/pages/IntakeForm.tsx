import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { categories } from "../data/categories";
import { listDioceses } from "../data/artist-tags";
import { useStore } from "../lib/store";
import type { CategorySlug, IntakeKind, ApprovalStep } from "../types";

// /partnerships/new — RFP-style institutional intake form.
// Multi-section but on one page (institutional patrons hate wizards).
export default function IntakeForm() {
  const { submitIntake } = useStore();
  const navigate = useNavigate();
  const dioceses = listDioceses();
  const [submitted, setSubmitted] = useState<{ id: string; title: string } | null>(null);
  const [approvers, setApprovers] = useState<ApprovalStep[]>([
    { role: "Pastor", status: "pending" },
    { role: "Finance Council", status: "pending" },
  ]);

  function addApprover() {
    setApprovers((cur) => [...cur, { role: "", status: "pending" }]);
  }
  function updateApprover(i: number, patch: Partial<ApprovalStep>) {
    setApprovers((cur) => cur.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function removeApprover(i: number) {
    setApprovers((cur) => cur.filter((_, idx) => idx !== i));
  }

  if (submitted) {
    return (
      <PageShell>
        <section className="container py-24 max-w-2xl text-center">
          <AnimatePresence>
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-olive-500/15 text-olive-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="mt-6 font-display text-4xl text-ink leading-tight">
                Your brief is live.
              </h1>
              <p className="mt-3 font-serif text-base text-ink-muted">
                Guild artists can now read <em>{submitted.title}</em> and submit
                proposals. We'll email you when the first one arrives.
              </p>
              <Ornament className="my-8" />
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild>
                  <Link to={`/partnerships/${submitted.id}`}>
                    Open the brief <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/partnerships">All partnerships</Link>
                </Button>
              </div>
              <p className="mt-8 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                Prototype · no notification is sent
              </p>
            </motion.div>
          </AnimatePresence>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          <Link to="/partnerships" className="hover:text-burgundy-500">
            Partnerships
          </Link>{" "}
          ›{" "}
          <span>Submit an institutional brief</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          Submit an institutional brief.
        </h1>
        <p className="mt-4 font-serif text-base text-ink-muted leading-relaxed">
          For dioceses, religious orders, parishes, and Catholic
          institutions commissioning multiple works or working through a
          chain of approval. Submit once; receive proposals from vetted
          guild artists.
        </p>
        <Ornament className="my-8" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            const intake = submitIntake({
              kind: String(d.get("kind") || "diocese-bulk") as IntakeKind,
              institutionName: String(d.get("institutionName") || ""),
              diocese: String(d.get("diocese") || "") || undefined,
              contactName: String(d.get("contactName") || ""),
              contactEmail: String(d.get("contactEmail") || ""),
              contactRole: String(d.get("contactRole") || "") || undefined,
              title: String(d.get("title") || ""),
              brief: String(d.get("brief") || ""),
              craft: String(d.get("craft") || "mixed") as CategorySlug | "mixed",
              budgetTotalUsd: d.get("budgetTotal") ? Number(d.get("budgetTotal")) : undefined,
              budgetPerWorkUsd: d.get("budgetPerWork") ? Number(d.get("budgetPerWork")) : undefined,
              quantity: Number(d.get("quantity") || 1),
              preferredDelivery: String(d.get("delivery") || "") || undefined,
              invoicingTerms: String(d.get("invoicingTerms") || "net-30") as "stripe-immediate" | "net-30" | "net-60" | "purchase-order",
              poNumber: String(d.get("poNumber") || "") || undefined,
              approvalChain: approvers.filter((a) => a.role.trim()),
            });
            setSubmitted({ id: intake.id, title: intake.title });
            window.scrollTo({ top: 0 });
          }}
          className="space-y-10"
        >
          <FormSection title="The institution">
            <Row>
              <FieldBlock label="Kind of institution" full>
                <select
                  name="kind"
                  required
                  defaultValue="diocese-bulk"
                  className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
                >
                  <option value="diocese-bulk">Diocese · bulk commission</option>
                  <option value="parish-altar">Parish · altar / chapel</option>
                  <option value="religious-order">Religious order</option>
                  <option value="school">School / university</option>
                  <option value="other-institution">Other Catholic institution</option>
                </select>
              </FieldBlock>
            </Row>
            <Row>
              <FieldBlock label="Institution name">
                <Input name="institutionName" required placeholder="e.g. Diocese of Pittsburgh" />
              </FieldBlock>
              <FieldBlock label="Diocese (if not above)">
                <select
                  name="diocese"
                  className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
                  defaultValue=""
                >
                  <option value="">Not applicable</option>
                  {dioceses.map((d) => (
                    <option key={d.diocese} value={d.diocese}>
                      {d.diocese}
                    </option>
                  ))}
                </select>
              </FieldBlock>
            </Row>
            <Row>
              <FieldBlock label="Your name">
                <Input name="contactName" required placeholder="Full name" />
              </FieldBlock>
              <FieldBlock label="Your role">
                <Input name="contactRole" placeholder="Chancellor, Director of Worship, etc." />
              </FieldBlock>
            </Row>
            <FieldBlock label="Your email">
              <Input name="contactEmail" type="email" required placeholder="chancery@diocese.org" autoComplete="email" />
            </FieldBlock>
          </FormSection>

          <FormSection title="The brief">
            <FieldBlock label="Title">
              <Input name="title" required placeholder="e.g. Fourteen stations of the cross for a new parish" />
            </FieldBlock>
            <FieldBlock label="Description">
              <Textarea
                name="brief"
                required
                rows={7}
                placeholder="What you're commissioning, in plain language. Style, materials, theological brief, where it will live, why it matters. Be particular — guild artists will read this carefully."
              />
            </FieldBlock>
            <Row>
              <FieldBlock label="Craft">
                <select
                  name="craft"
                  required
                  defaultValue="mixed"
                  className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
                >
                  <option value="mixed">Mixed / open to proposals</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FieldBlock>
              <FieldBlock label="How many works">
                <Input name="quantity" type="number" min={1} defaultValue={1} required />
              </FieldBlock>
            </Row>
            <Row>
              <FieldBlock label="Total budget (USD, optional)">
                <Input name="budgetTotal" type="number" min={0} step={500} placeholder="e.g. 56000" />
              </FieldBlock>
              <FieldBlock label="Per-work cap (USD, optional)">
                <Input name="budgetPerWork" type="number" min={0} step={100} placeholder="e.g. 4000" />
              </FieldBlock>
            </Row>
            <FieldBlock label="Preferred delivery date">
              <Input name="delivery" type="date" />
            </FieldBlock>
          </FormSection>

          <FormSection title="Billing">
            <Row>
              <FieldBlock label="Invoicing terms">
                <select
                  name="invoicingTerms"
                  defaultValue="net-30"
                  className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
                >
                  <option value="net-30">NET-30 invoicing (recommended for institutions)</option>
                  <option value="net-60">NET-60 invoicing</option>
                  <option value="purchase-order">Purchase order against contract</option>
                  <option value="stripe-immediate">Immediate Stripe capture (individual commission)</option>
                </select>
              </FieldBlock>
              <FieldBlock label="Purchase order number (optional)">
                <Input name="poNumber" placeholder="e.g. DGAL-2026-0007" />
              </FieldBlock>
            </Row>
          </FormSection>

          <FormSection title="Approval chain">
            <p className="font-serif text-sm text-ink-muted mb-4 leading-relaxed">
              Who has to sign off before a commission moves forward? List each
              role. You can add or remove members after the brief is posted.
            </p>
            <ul className="space-y-3">
              {approvers.map((a, i) => (
                <li key={i} className="grid grid-cols-12 gap-2 items-end">
                  <FieldBlock label={i === 0 ? "Role" : undefined} className="col-span-4">
                    <Input
                      value={a.role}
                      onChange={(e) => updateApprover(i, { role: e.target.value })}
                      placeholder="Pastor / Bishop / Finance Council"
                    />
                  </FieldBlock>
                  <FieldBlock label={i === 0 ? "Name (optional)" : undefined} className="col-span-4">
                    <Input
                      value={a.name ?? ""}
                      onChange={(e) => updateApprover(i, { name: e.target.value })}
                      placeholder="e.g. Fr. James"
                    />
                  </FieldBlock>
                  <FieldBlock label={i === 0 ? "Email (optional)" : undefined} className="col-span-3">
                    <Input
                      value={a.email ?? ""}
                      onChange={(e) => updateApprover(i, { email: e.target.value })}
                      placeholder="pastor@parish.org"
                      type="email"
                    />
                  </FieldBlock>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeApprover(i)}
                      aria-label="Remove approver"
                    >
                      –
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addApprover}>
              + Add approver
            </Button>
          </FormSection>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg">
              Publish the brief <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button asChild variant="link">
              <Link to="/partnerships">Cancel</Link>
            </Button>
          </div>
          <p className="font-serif text-xs italic text-ink-muted max-w-xl">
            Once published, the brief is visible to guild artists who can
            submit proposals. You'll review proposals here and award one.
          </p>
        </form>
      </section>
    </PageShell>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-600 mb-4 pb-2 border-b border-ink/10">
        {title}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-5">{children}</div>;
}

function FieldBlock({
  label,
  children,
  full,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  full?: boolean;
  className?: string;
}) {
  return (
    <Label className={(className ?? "") + (full ? " sm:col-span-2 " : " ") + "block space-y-2"}>
      {label && <span className="block">{label}</span>}
      {children}
    </Label>
  );
}
