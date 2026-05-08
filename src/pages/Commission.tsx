import { useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { artistBySlug } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { formatPrice, initials } from "../lib/utils";

const SETTINGS = [
  "Parish or chapel",
  "Domestic chapel or oratory",
  "Family home",
  "Gift to a person",
  "Gift to a community",
  "School or institution",
  "Other",
];

export default function Commission() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const tierId = params.get("tier");
  const isCustom = params.get("custom") === "true";
  const navigate = useNavigate();
  const { addRequest } = useStore();
  const artist = artistBySlug(slug);

  const [submitted, setSubmitted] = useState<null | {
    requestId: string;
    artistName: string;
  }>(null);

  if (!artist) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl">Artist not found</h1>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/browse">Browse the guild</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const tier = artist.tiers.find((t) => t.id === tierId) ?? artist.tiers[0];
  const primaryCategory = categoryBySlug(artist.categories[0]);

  if (submitted) {
    return (
      <PageShell>
        <section className="container py-16 sm:py-24 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-olive-500/15 text-olive-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-8 font-display text-4xl sm:text-5xl text-ink leading-tight">
              Your request is on its way.
            </h1>
            <p className="mt-4 font-serif text-lg text-ink-muted">
              {submitted.artistName} typically responds within a week.
              We'll notify you here when there is a reply.
            </p>
            <Ornament className="my-10" />
            <p className="font-serif italic text-base text-ink-soft max-w-md mx-auto">
              “The artist's gaze is patient. Receive their response with the
              same patience.”
            </p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Button asChild>
                <Link to="/dashboard">View your commission</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/browse">Browse other artists</Link>
              </Button>
            </div>
            <div className="mt-8 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              Request id · {submitted.requestId}
            </div>
          </motion.div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16 max-w-5xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-4">
          <Link to={`/artists/${artist.slug}`} className="hover:text-burgundy-500">
            {artist.honorific ? `${artist.honorific} ` : ""}
            {artist.name}
          </Link>{" "}
          <span className="mx-2">›</span> Commission
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          {isCustom ? "Custom commission" : `Commission ${artist.name.split(" ")[0]}`}
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl">
          Tell the artist what you long for. They will reply with questions,
          a refined quote, and a turnaround estimate before you pay anything.
        </p>
        <Ornament className="my-10" />

        <div className="grid lg:grid-cols-12 gap-10">
          <form
            className="lg:col-span-7 space-y-7"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const req = addRequest({
                artistSlug: artist.slug,
                fromName: String(data.get("name") || ""),
                fromEmail: String(data.get("email") || ""),
                category: artist.categories[0],
                setting: String(data.get("setting") || ""),
                description: String(data.get("description") || ""),
                budgetUsd: data.get("budget") ? Number(data.get("budget")) : undefined,
                preferredDeadline: String(data.get("deadline") || "") || undefined,
              });
              setSubmitted({
                requestId: req.id,
                artistName: artist.name,
              });
              window.scrollTo({ top: 0 });
            }}
          >
            <Field label="Your name">
              <Input name="name" required placeholder="e.g. Mary Beauchamp" />
            </Field>
            <Field label="Email">
              <Input
                name="email"
                type="email"
                required
                placeholder="for the artist's reply"
              />
            </Field>

            <Field label="What is this commission for?">
              <Select name="setting" defaultValue={SETTINGS[0]}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SETTINGS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Describe what you long for">
              <Textarea
                name="description"
                required
                rows={6}
                placeholder="The saint, the season, the recipient, the room. The mood. The size, if it matters. Be plain — they are listening."
              />
              <p className="mt-2 font-serif text-sm text-ink-muted italic">
                The more particular, the better. Include scripture or
                feast-day references if they apply.
              </p>
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Budget (USD, optional)">
                <Input
                  name="budget"
                  type="number"
                  min={0}
                  step={50}
                  placeholder={`From ${tier.startingAt}`}
                />
              </Field>
              <Field label="Preferred completion date">
                <Input name="deadline" type="date" />
              </Field>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Button type="submit" size="lg">
                Send to {artist.name.split(" ")[0]}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild variant="link">
                <Link to={`/artists/${artist.slug}`}>Back to profile</Link>
              </Button>
            </div>
            <p className="font-serif text-xs italic text-ink-muted max-w-md">
              You will not be charged. The artist will reply with a refined
              quote; payment is arranged only after both parties agree.
            </p>
          </form>

          {/* Summary aside */}
          <aside className="lg:col-span-5">
            <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden lg:sticky lg:top-24">
              <div
                className="aspect-[5/3] relative"
                style={{
                  background: `linear-gradient(135deg, ${artist.portraitFrom} 0%, ${artist.portraitTo} 100%)`,
                }}
              >
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-parchment-50/15 ring-1 ring-parchment-50/30">
                    <span className="font-display text-2xl text-parchment-50">
                      {initials(artist.name)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
                  Commissioning
                </div>
                <div className="mt-2 font-display text-2xl text-ink leading-tight">
                  {artist.honorific ? `${artist.honorific} ` : ""}
                  {artist.name}
                </div>
                <div className="mt-1 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
                  {primaryCategory?.name} · {artist.city}
                </div>

                <div className="mt-5 pt-5 border-t border-ink/10">
                  <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                    {isCustom ? "Custom request" : `Tier · ${tier.name}`}
                  </div>
                  {!isCustom && (
                    <>
                      <div className="mt-1 font-display text-2xl text-burgundy-500">
                        {formatPrice(tier.startingAt)}
                        <span className="text-xs text-ink-muted font-sans ml-1">
                          starting
                        </span>
                      </div>
                      <p className="mt-2 font-serif text-sm text-ink-soft">
                        {tier.description}
                      </p>
                      <div className="mt-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                        Turnaround: {tier.turnaroundWeeks[0]}–
                        {tier.turnaroundWeeks[1]} weeks
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
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
