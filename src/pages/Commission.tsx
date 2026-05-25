import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
import { FeastDeadlinePicker } from "../components/FeastDeadlinePicker";
import { useStore } from "../lib/store";
import { PLATFORM_FEE_PCT } from "../lib/pricing";
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
  const { createCommission } = useStore();
  const artist = artistBySlug(slug);

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
              const deadline = String(data.get("deadline") || "");
              const feastSlug = String(data.get("feastSlug") || "");
              const feastName = String(data.get("feastName") || "");
              const ipTerms = String(data.get("ipTerms") || "patron-exclusive") as
                | "patron-exclusive"
                | "shared-prints"
                | "artist-retains";
              const c = createCommission({
                artistSlug: artist.slug,
                patronName: String(data.get("name") || ""),
                patronEmail: String(data.get("email") || ""),
                category: artist.categories[0],
                setting: String(data.get("setting") || ""),
                scope: String(data.get("description") || ""),
                preferredDeadline: deadline || undefined,
                feastDeadline:
                  feastSlug && feastName && deadline
                    ? { feastSlug, name: feastName, date: deadline }
                    : undefined,
                parishOrChapel:
                  String(data.get("parishOrChapel") || "") || undefined,
                ipTerms,
              });
              navigate(`/workspace/${c.id}`);
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

            <Field label="Parish, chapel, or address (optional)">
              <Input
                name="parishOrChapel"
                placeholder="Where will the work live?"
                autoComplete="off"
              />
            </Field>

            <FeastDeadlinePicker
              minWeeks={tier.turnaroundWeeks[0] ?? 6}
            />

            <Field label="Reproduction rights">
              <select
                name="ipTerms"
                defaultValue="patron-exclusive"
                className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
              >
                <option value="patron-exclusive">
                  Patron-exclusive — I own all rights (recommended)
                </option>
                <option value="shared-prints">
                  Shared — artist may sell prints
                </option>
                <option value="artist-retains">
                  Artist retains reproduction rights
                </option>
              </select>
              <p className="mt-2 font-serif text-sm text-ink-muted italic">
                You can renegotiate later. The artist will see your selection
                when reviewing the request.
              </p>
            </Field>

            <div className="pt-2 rounded-md border border-ink/10 bg-parchment-100 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-olive-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-display text-base text-ink">
                    Funds held in escrow. Released only by you.
                  </div>
                  <p className="mt-1 font-serif text-sm text-ink-soft leading-relaxed">
                    The artist receives 100% of the price they quote. Our{" "}
                    {Math.round(PLATFORM_FEE_PCT * 100)}% platform fee is added
                    on top — never deducted from the artist. Payment is split
                    across three milestones (deposit, midpoint, final).
                  </p>
                </div>
              </div>
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
              You will not be charged yet. The artist will reply with a quote
              and you'll fund the deposit only when you accept.
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
    <Label className="block space-y-2">
      <span className="block">{label}</span>
      {children}
    </Label>
  );
}
