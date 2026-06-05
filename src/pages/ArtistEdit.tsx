import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Loader2,
  Save,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { api } from "../lib/api";
import { artistBySlug } from "../data/artists";

// The vocation questionnaire — 10 questions drawn from John Paul II's
// Letter to Artists (1999). The artist answers in their own words.
// Workers AI then synthesizes a draft mission, studio rhythm, and
// process note. The artist edits any of it. Nothing is invented.

interface Question {
  id: keyof Responses;
  eyebrow: string;
  prompt: string;
  helper: string;
  placeholder: string;
}

interface Responses {
  q1_first_call: string;
  q2_lineage: string;
  q3_canon: string;
  q4_patron_saints: string;
  q5_rhythm: string;
  q6_materials: string;
  q7_for_parish: string;
  q8_for_home: string;
  q9_the_cost: string;
  q10_the_prayer: string;
}

const EMPTY: Responses = {
  q1_first_call: "",
  q2_lineage: "",
  q3_canon: "",
  q4_patron_saints: "",
  q5_rhythm: "",
  q6_materials: "",
  q7_for_parish: "",
  q8_for_home: "",
  q9_the_cost: "",
  q10_the_prayer: "",
};

const QUESTIONS: Question[] = [
  {
    id: "q1_first_call",
    eyebrow: "I. The first work",
    prompt: "When did you first see something made by human hands that you could not look away from?",
    helper:
      "An icon in a parish you visited as a child, a sculpture in a museum, a piece of music at a funeral. The thing that started this.",
    placeholder: "I was nine, and my grandmother took me to…",
  },
  {
    id: "q2_lineage",
    eyebrow: "II. Lineage",
    prompt: "Who taught you? Where did you train?",
    helper:
      "Name your masters, your studios, your apprenticeships. The places. The people whose hands you watched.",
    placeholder: "I trained at the Prosopon School under N…",
  },
  {
    id: "q3_canon",
    eyebrow: "III. The canon",
    prompt: "What tradition do you work in?",
    helper:
      "Byzantine, Western, vernacular, contemporary. The rules you keep. The schools you draw from.",
    placeholder: "Egg tempera in the Byzantine canon, with gold leaf laid on gesso ground…",
  },
  {
    id: "q4_patron_saints",
    eyebrow: "IV. Patron saints",
    prompt: "Which saints accompany your work? Why?",
    helper:
      "Their names, and how they reached you. A few sentences each, if it helps.",
    placeholder: "St. Luke, the icon-writer; St. Joseph, the workman of silence…",
  },
  {
    id: "q5_rhythm",
    eyebrow: "V. The rhythm",
    prompt: "What carries your day?",
    helper:
      "Liturgy of the Hours, particular fasts, north light only, music, silence. The unromantic rule.",
    placeholder: "I work between Lauds and Vespers, never under artificial light…",
  },
  {
    id: "q6_materials",
    eyebrow: "VI. Materials",
    prompt: "What do you work with?",
    helper:
      "Pigments, panel, stone, gold leaf, voices, ink, vellum. Be specific. The hand wants particulars.",
    placeholder: "Hand-ground pigments, kolinsky brushes, oak panels prepared with rabbit-skin glue…",
  },
  {
    id: "q7_for_parish",
    eyebrow: "VII. For the parish",
    prompt: "What do you offer to the Church?",
    helper: "What kind of work do you make for sanctuaries, side chapels, parish life?",
    placeholder: "Iconostasis panels, side-altar saints, Stations of the Cross cycles…",
  },
  {
    id: "q8_for_home",
    eyebrow: "VIII. For the home",
    prompt: "What do you offer to the household?",
    helper: "Domestic icons, baptismal gifts, oratory pieces, missal illuminations.",
    placeholder: "Pocket icons for baptisms, family portraits of patron saints…",
  },
  {
    id: "q9_the_cost",
    eyebrow: "IX. The cost",
    prompt: "What does the work ask of you that nothing else does?",
    helper:
      "The discipline that hurts. The temptation. The thing only this vocation asks. Speak plainly.",
    placeholder: "The hardest part is…",
  },
  {
    id: "q10_the_prayer",
    eyebrow: "X. The prayer",
    prompt: "When you finish a piece and hand it over, what do you pray for the patron who receives it?",
    helper: "A blessing. A petition. A few lines, in your own words.",
    placeholder: "May the work be a window…",
  },
];

type Tab = "questions" | "review" | "endorsement" | "links";

interface VerificationRow {
  id: string;
  status: string;
  role: string;
  verifier_name: string;
  verifier_email: string;
  parish_or_community: string;
  diocese: string | null;
  created_at: string;
  endorsed_at: string | null;
  expires_at: string | null;
}

export default function ArtistEdit() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const staticArtist = artistBySlug(slug);
  const [tab, setTab] = useState<Tab>("questions");
  const [responses, setResponses] = useState<Responses>(EMPTY);
  const [synth, setSynth] = useState({
    mission_statement: "",
    studio_rhythm: "",
    process_note: "",
    vocation_statement: staticArtist?.vocationStatement ?? "",
    instagram_handle: "",
    x_handle: "",
    personal_url: "",
    sabbatical_until: "",
    trained_under: "",
    trained_under_slug: "",
  });
  const [profilePublished, setProfilePublished] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savingQ, setSavingQ] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [savingP, setSavingP] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  // Per-question gentle nudges from the synthesizer's last run.
  const [nudges, setNudges] = useState<Record<string, string>>({});
  const [synthOffline, setSynthOffline] = useState(false);

  // Load existing responses + artist profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [qRes, aRes] = await Promise.all([
        api.questionnaire(slug),
        api.artist(slug),
      ]);
      if (cancelled) return;
      if (!qRes.ok && qRes.status === 403) {
        setForbidden(true);
        setLoaded(true);
        return;
      }
      if (qRes.ok && qRes.data.responses) {
        const r = qRes.data.responses;
        setResponses({
          q1_first_call: r.q1_first_call ?? "",
          q2_lineage: r.q2_lineage ?? "",
          q3_canon: r.q3_canon ?? "",
          q4_patron_saints: r.q4_patron_saints ?? "",
          q5_rhythm: r.q5_rhythm ?? "",
          q6_materials: r.q6_materials ?? "",
          q7_for_parish: r.q7_for_parish ?? "",
          q8_for_home: r.q8_for_home ?? "",
          q9_the_cost: r.q9_the_cost ?? "",
          q10_the_prayer: r.q10_the_prayer ?? "",
        });
      }
      if (aRes.ok) {
        const a = aRes.data.artist as Record<string, string | number | null>;
        setSynth({
          mission_statement: (a.mission_statement as string) ?? "",
          studio_rhythm: (a.studio_rhythm as string) ?? "",
          process_note: (a.process_note as string) ?? "",
          vocation_statement: (a.vocation_statement as string) ?? staticArtist?.vocationStatement ?? "",
          instagram_handle: (a.instagram_handle as string) ?? "",
          x_handle: (a.x_handle as string) ?? "",
          personal_url: (a.personal_url as string) ?? "",
          sabbatical_until: (a.sabbatical_until as string) ?? "",
          trained_under: (a.trained_under as string) ?? "",
          trained_under_slug: (a.trained_under_slug as string) ?? "",
        });
        setProfilePublished(Boolean(a.profile_published));
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, staticArtist]);

  if (!staticArtist) {
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

  if (forbidden) {
    return (
      <PageShell>
        <div className="container py-24 max-w-xl text-center">
          <h1 className="font-display text-3xl">
            This page is the artist's own.
          </h1>
          <p className="mt-4 font-serif text-ink-muted">
            Only {staticArtist.name} (or a guild operator) can edit this
            profile.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to={`/artists/${slug}`}>View their profile</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const completedCount = Object.values(responses).filter((v) => v.trim()).length;
  const allAnswered = completedCount === QUESTIONS.length;
  const someAnswered = completedCount > 0;

  async function saveQuestionnaire() {
    setSavingQ(true);
    setError(null);
    const res = await api.saveQuestionnaire(slug, responses as unknown as Record<string, string>);
    setSavingQ(false);
    if (!res.ok) {
      setError("Couldn't save just now. Please try again.");
      return;
    }
    setSavedAt(new Date().toISOString());
  }

  async function runSynthesis() {
    if (!someAnswered) return;
    setSynthesizing(true);
    setError(null);
    setSynthOffline(false);
    // Save first so the model sees the latest answers.
    await api.saveQuestionnaire(slug, responses as unknown as Record<string, string>);
    const res = await api.synthesizeVocation(slug);
    setSynthesizing(false);
    if (!res.ok) {
      if (res.status === 503) {
        setSynthOffline(true);
      } else {
        setError(
          "The synthesizer hesitated. Try again, or write the three sections by hand below.",
        );
      }
      return;
    }
    setSynth((s) => ({
      ...s,
      mission_statement: res.data.synthesis.mission_statement,
      studio_rhythm: res.data.synthesis.studio_rhythm,
      process_note: res.data.synthesis.process_note,
    }));
    // Surface per-question nudges from the model.
    const map: Record<string, string> = {};
    for (const n of res.data.synthesis.needs_expansion ?? []) {
      map[n.field] = n.nudge;
    }
    setNudges(map);
    // If we have at least one substantive field, jump to review; if
    // EVERYTHING came back empty plus a pile of nudges, stay on
    // Questions so the artist can address them.
    const hasContent =
      res.data.synthesis.mission_statement.trim() ||
      res.data.synthesis.studio_rhythm.trim() ||
      res.data.synthesis.process_note.trim();
    if (hasContent) setTab("review");
  }

  async function saveProfile() {
    setSavingP(true);
    setError(null);
    const res = await api.saveArtistProfile(slug, {
      mission_statement: synth.mission_statement,
      studio_rhythm: synth.studio_rhythm,
      process_note: synth.process_note,
      vocation_statement: synth.vocation_statement,
      instagram_handle: synth.instagram_handle,
      x_handle: synth.x_handle,
      personal_url: synth.personal_url,
      sabbatical_until: synth.sabbatical_until,
      trained_under: synth.trained_under,
      trained_under_slug: synth.trained_under_slug,
      profile_published: profilePublished,
    });
    setSavingP(false);
    if (!res.ok) {
      setError("Couldn't save just now.");
      return;
    }
    setSavedAt(new Date().toISOString());
  }

  return (
    <PageShell>
      <Seo
        title={`Edit your vocation site — ${staticArtist.name}`}
        description="The questionnaire and editor for your guild profile."
        path={`/artists/${slug}/edit`}
        robots="noindex,nofollow"
      />

      <section className="container pt-10 sm:pt-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted mb-3">
          <Link to={`/artists/${slug}`} className="hover:text-burgundy-500 inline-flex items-center">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to your profile
          </Link>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-2">
              Your vocation site
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
              Tell us about your call. We'll shape the rest.
            </h1>
            <p className="mt-3 font-serif text-base text-ink-muted max-w-2xl">
              Ten short questions, drawn from John Paul II's <em>Letter to
              Artists</em>. Answer in your own words. A quiet model will
              read them and draft three short sections for your public
              page — mission, rhythm, process. You edit anything you want.
              Nothing is invented; what you didn't say is left unsaid.
            </p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/artists/${slug}`}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </Link>
            </Button>
          </div>
        </div>
        <Ornament className="my-8" />
      </section>

      <section className="container">
        <div className="inline-flex rounded-full bg-parchment-200/60 p-1 mb-8">
          {(
            [
              ["questions", "I. Questions", `${completedCount}/${QUESTIONS.length}`],
              ["review", "II. Review draft", null],
              ["endorsement", "III. Endorsement", null],
              ["links", "IV. Socials", null],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                "min-h-[36px] px-4 py-2 rounded-full font-sans text-[11px] uppercase tracking-[0.18em] transition-colors " +
                (tab === id ? "bg-ink text-parchment-50" : "text-ink-soft hover:text-ink")
              }
            >
              {label}
              {count && <span className="ml-2 opacity-70 tabular-nums">{count}</span>}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-burgundy-500/30 bg-burgundy-500/5 p-3 font-serif text-sm text-burgundy-500">
            {error}
          </div>
        )}
        {synthOffline && (
          <div className="mb-6 rounded-md border border-gold-500/30 bg-gold-500/5 p-4 font-serif text-sm text-ink-soft">
            <strong className="text-ink">The synthesizer isn't switched on yet.</strong>{" "}
            Your answers are saved. The guild operator needs to set
            <code className="font-mono text-xs mx-1 px-1 bg-parchment-100 rounded">ANTHROPIC_API_KEY</code>
            for Claude to read your answers. In the meantime, every
            field on the Review tab can be written by hand.
          </div>
        )}

        {!loaded && (
          <div className="py-24 text-center font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" /> Reading
            your previous answers…
          </div>
        )}

        {loaded && tab === "questions" && (
          <div className="grid lg:grid-cols-12 gap-10 pb-20">
            <ol className="lg:col-span-8 space-y-12">
              {QUESTIONS.map((q) => (
                <motion.li
                  key={q.id}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold-600">
                    {q.eyebrow}
                  </div>
                  <h2 className="font-display text-2xl text-ink leading-snug">
                    {q.prompt}
                  </h2>
                  <p className="font-serif text-sm italic text-ink-muted max-w-2xl leading-relaxed">
                    {q.helper}
                  </p>
                  <Textarea
                    rows={5}
                    value={responses[q.id]}
                    onChange={(e) =>
                      setResponses((r) => ({ ...r, [q.id]: e.target.value }))
                    }
                    placeholder={q.placeholder}
                  />
                  {nudges[q.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-md bg-gold-500/5 border-l-2 border-gold-500 px-3 py-2 font-serif text-sm italic text-ink-soft leading-relaxed"
                    >
                      <span className="not-italic font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mr-2">
                        From the editor
                      </span>
                      {nudges[q.id]}
                    </motion.div>
                  )}
                </motion.li>
              ))}
            </ol>

            <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start space-y-4">
              <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5">
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-2">
                  Progress
                </div>
                <div className="font-display text-3xl text-ink tabular-nums">
                  {completedCount}
                  <span className="text-ink-muted text-xl"> / {QUESTIONS.length}</span>
                </div>
                <p className="mt-3 font-serif text-sm text-ink-soft leading-relaxed">
                  Save as often as you like. Synthesis can run any time
                  you've answered at least a few questions; it always
                  uses the latest version.
                </p>
                {savedAt && (
                  <div className="mt-3 font-sans text-[11px] uppercase tracking-[0.18em] text-olive-600 inline-flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
                  </div>
                )}
              </div>
              <Button
                onClick={saveQuestionnaire}
                disabled={savingQ}
                variant="outline"
                className="w-full"
              >
                {savingQ ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save draft
              </Button>
              <Button
                onClick={runSynthesis}
                disabled={!someAnswered || synthesizing}
                className="w-full"
              >
                {synthesizing
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reading…</>
                  : <><Sparkles className="h-4 w-4 mr-2" /> {allAnswered ? "Synthesize a draft" : "Synthesize what you've answered"}</>}
              </Button>
              <p className="font-serif text-xs italic text-ink-muted leading-relaxed">
                Claude Sonnet, instructed to prefer your exact words and
                invent nothing. If an answer is thin, it tells you so
                in the margin — gently, in the second person — and
                leaves that field empty for you to fill.
              </p>
            </aside>
          </div>
        )}

        {loaded && tab === "review" && (
          <div className="grid lg:grid-cols-12 gap-10 pb-20">
            <div className="lg:col-span-8 space-y-8">
              <ReviewField
                eyebrow="Mission statement"
                helper="One sentence. First person. The line you'd want under your name on the parish bulletin."
                value={synth.mission_statement}
                rows={3}
                onChange={(v) => setSynth((s) => ({ ...s, mission_statement: v }))}
              />
              <ReviewField
                eyebrow="Studio rhythm"
                helper="A short paragraph: how you actually work. What the day looks like. The unromantic rule."
                value={synth.studio_rhythm}
                rows={6}
                onChange={(v) => setSynth((s) => ({ ...s, studio_rhythm: v }))}
              />
              <ReviewField
                eyebrow="Process & formation"
                helper="A few paragraphs: who taught you, what tradition, what you make for the parish and the home."
                value={synth.process_note}
                rows={10}
                onChange={(v) => setSynth((s) => ({ ...s, process_note: v }))}
              />
              <ReviewField
                eyebrow="Tagline (used on the artist card)"
                helper="A short, declarative line. You can keep your existing one or write a new one."
                value={synth.vocation_statement}
                rows={2}
                onChange={(v) => setSynth((s) => ({ ...s, vocation_statement: v }))}
              />
              <ReviewField
                eyebrow="Trained under"
                helper="The master, studio, or school where you trained — free text. If your master is in this guild, you can also enter their slug below and we'll link to their profile."
                value={synth.trained_under}
                rows={2}
                onChange={(v) => setSynth((s) => ({ ...s, trained_under: v }))}
              />
              <div className="space-y-2">
                <div className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold-600">
                  Master's slug (if a guild artist)
                </div>
                <p className="font-serif text-sm italic text-ink-muted">
                  e.g. "br-andrew-of-subiaco" — if blank, "Trained under" renders as plain text.
                </p>
                <Input
                  value={synth.trained_under_slug}
                  onChange={(e) =>
                    setSynth((s) => ({ ...s, trained_under_slug: e.target.value }))
                  }
                  placeholder="(optional)"
                />
              </div>
            </div>
            <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start space-y-3">
              <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5">
                <Label className="block">
                  <input
                    type="checkbox"
                    className="mr-2 align-middle"
                    checked={profilePublished}
                    onChange={(e) => setProfilePublished(e.target.checked)}
                  />
                  Publish my profile
                </Label>
                <p className="mt-2 font-serif text-sm text-ink-soft leading-relaxed">
                  When unchecked, the public page shows your original
                  guild bio only. When checked, your synthesized
                  mission, rhythm, and process appear, and your profile
                  is reachable at{" "}
                  <code className="font-mono text-xs">/{slug}</code> as
                  well as <code className="font-mono text-xs">/artists/{slug}</code>.
                </p>
              </div>

              {/* Sabbatical mode — interior life protection. */}
              <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5">
                <div className="font-display text-base text-ink">
                  On retreat
                </div>
                <p className="mt-1 font-serif text-sm text-ink-soft leading-relaxed">
                  Set a date you'll return to the studio. Until then,
                  patrons see "On retreat — back {synth.sabbatical_until ? new Date(synth.sabbatical_until).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : '___'}" on
                  your profile, the commission button becomes "leave a
                  letter for when they return," and no responsiveness
                  clock runs against you. Leave empty to clear.
                </p>
                <div className="mt-3">
                  <Input
                    type="date"
                    value={synth.sabbatical_until}
                    onChange={(e) =>
                      setSynth((s) => ({ ...s, sabbatical_until: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={saveProfile}
                disabled={savingP}
                className="w-full"
              >
                {savingP ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save profile
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/artists/${slug}`}>
                  <Eye className="h-4 w-4 mr-2" /> Preview your page
                </Link>
              </Button>
              {savedAt && (
                <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-olive-600 inline-flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
                </div>
              )}
            </aside>
          </div>
        )}

        {loaded && tab === "endorsement" && (
          <EndorsementPanel
            slug={slug}
            artistName={staticArtist.name}
            onError={setError}
          />
        )}

        {loaded && tab === "links" && (
          <div className="grid lg:grid-cols-12 gap-10 pb-20">
            <div className="lg:col-span-8 space-y-6">
              <Field
                label="Instagram handle"
                helper="Without the @"
              >
                <Input
                  value={synth.instagram_handle}
                  onChange={(e) =>
                    setSynth((s) => ({ ...s, instagram_handle: e.target.value.replace(/^@/, "") }))
                  }
                  placeholder="maria.chrysostom"
                />
              </Field>
              <Field
                label="X (Twitter) handle"
                helper="Without the @"
              >
                <Input
                  value={synth.x_handle}
                  onChange={(e) =>
                    setSynth((s) => ({ ...s, x_handle: e.target.value.replace(/^@/, "") }))
                  }
                  placeholder="maria_writes_icons"
                />
              </Field>
              <Field
                label="Your own website"
                helper="If you keep a separate site, link it here. Otherwise leave empty — your guild page is your site."
              >
                <Input
                  type="url"
                  value={synth.personal_url}
                  onChange={(e) => setSynth((s) => ({ ...s, personal_url: e.target.value }))}
                  placeholder="https://…"
                />
              </Field>
            </div>
            <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start space-y-3">
              <Button
                onClick={saveProfile}
                disabled={savingP}
                className="w-full"
              >
                {savingP ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save links
              </Button>
              {savedAt && (
                <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-olive-600 inline-flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
                </div>
              )}
            </aside>
          </div>
        )}

        {loaded && (
          <div className="pb-20">
            <div className="rounded-md border border-ink/10 bg-parchment-100 p-5 max-w-3xl">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-burgundy-500 shrink-0 mt-1" />
                <div className="grow">
                  <div className="font-display text-base text-ink">
                    A note on the synthesizer
                  </div>
                  <p className="mt-2 font-serif text-sm text-ink-soft leading-relaxed">
                    It is instructed to prefer your exact phrasing, omit
                    anything you did not say, and never to use marketing
                    language. If the draft does not sound like you,
                    rewrite it. Or skip it entirely — every field on the
                    Review tab can be written by hand.
                  </p>
                  {tab !== "review" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setTab("review")}
                    >
                      Go to the review tab <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

// The pastor / superior / chancery endorsement panel. The artist
// enters the verifier's email + parish; we send a one-click
// endorsement page. No account required for the verifier.
function EndorsementPanel({
  slug,
  artistName,
  onError,
}: {
  slug: string;
  artistName: string;
  onError: (e: string | null) => void;
}) {
  const [list, setList] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    pastor_email: "",
    pastor_name: "",
    parish_or_community: "",
    parish_website: "",
    diocese: "",
    role: "pastor" as "pastor" | "religious-superior" | "chancery",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.listVerifications(slug);
      if (cancelled) return;
      if (res.ok) setList(res.data.verifications);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  async function send() {
    if (!form.pastor_email || !form.parish_or_community) {
      onError("Please fill in at least the email and parish.");
      return;
    }
    setSending(true);
    onError(null);
    const res = await api.requestEndorsement(slug, {
      pastor_email: form.pastor_email,
      pastor_name: form.pastor_name || undefined,
      parish_or_community: form.parish_or_community,
      parish_website: form.parish_website || undefined,
      diocese: form.diocese || undefined,
      role: form.role,
    });
    setSending(false);
    if (!res.ok) {
      onError("Couldn't send the request just now. Please try again.");
      return;
    }
    setSent(true);
    setForm({
      pastor_email: "",
      pastor_name: "",
      parish_or_community: "",
      parish_website: "",
      diocese: "",
      role: "pastor",
    });
    // Re-fetch the list
    const listRes = await api.listVerifications(slug);
    if (listRes.ok) setList(listRes.data.verifications);
    setTimeout(() => setSent(false), 5000);
  }

  return (
    <div className="grid lg:grid-cols-12 gap-10 pb-20">
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6">
          <div className="font-display text-lg text-ink mb-2">
            Send a one-click endorsement request
          </div>
          <p className="font-serif text-sm text-ink-soft leading-relaxed mb-5">
            We do not accept artists into the guild without a witness. Enter
            your pastor's email (or your religious superior's, or your
            diocesan chancery's). They will receive a single short page —
            no account required — where they can endorse you, decline, or
            ask for a conversation. The whole interaction takes about a
            minute on their end.
          </p>
          <div className="space-y-4">
            <Field label="Email" helper="Their direct address — ideally the parish email, not a personal Gmail.">
              <Input
                type="email"
                value={form.pastor_email}
                onChange={(e) => setForm((f) => ({ ...f, pastor_email: e.target.value }))}
                placeholder="frwalsh@stmichaels-pittsburgh.org"
              />
            </Field>
            <Field label="Their name" helper="As they would want it shown.">
              <Input
                value={form.pastor_name}
                onChange={(e) => setForm((f) => ({ ...f, pastor_name: e.target.value }))}
                placeholder="Fr. Daniel Walsh"
              />
            </Field>
            <Field label="Parish or community">
              <Input
                value={form.parish_or_community}
                onChange={(e) => setForm((f) => ({ ...f, parish_or_community: e.target.value }))}
                placeholder="St. Michael the Archangel, Pittsburgh"
              />
            </Field>
            <Field label="Parish website (optional)">
              <Input
                type="url"
                value={form.parish_website}
                onChange={(e) => setForm((f) => ({ ...f, parish_website: e.target.value }))}
                placeholder="https://stmichaels-pittsburgh.org"
              />
            </Field>
            <Field label="Diocese (optional)">
              <Input
                value={form.diocese}
                onChange={(e) => setForm((f) => ({ ...f, diocese: e.target.value }))}
                placeholder="Diocese of Pittsburgh"
              />
            </Field>
            <Field label="Their role">
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as typeof form.role,
                  }))
                }
                className="flex h-11 w-full rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm focusable"
              >
                <option value="pastor">Pastor</option>
                <option value="religious-superior">Religious superior</option>
                <option value="chancery">Chancery</option>
              </select>
            </Field>
            <Button onClick={send} disabled={sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Send the endorsement request
            </Button>
            {sent && (
              <div className="mt-2 inline-flex items-center font-sans text-[11px] uppercase tracking-[0.18em] text-olive-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Sent. They'll receive
                it within a minute.
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
          Your endorsement requests
        </div>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
        ) : list.length === 0 ? (
          <p className="font-serif text-sm italic text-ink-muted">
            None yet. Send your first request to {artistName.split(" ")[0]}'s
            pastor or superior to begin.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((v) => (
              <li
                key={v.id}
                className="rounded-md border border-ink/10 bg-parchment-50 p-4"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="font-display text-base text-ink leading-tight">
                    {v.verifier_email}
                  </div>
                  <span
                    className={
                      "font-sans text-[10px] uppercase tracking-[0.22em] " +
                      (v.status === "endorsed"
                        ? "text-olive-600"
                        : v.status === "declined" || v.status === "expired"
                          ? "text-burgundy-500"
                          : "text-gold-600")
                    }
                  >
                    {v.status.replace(/-/g, " ")}
                  </span>
                </div>
                <div className="mt-1 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  {v.parish_or_community}
                  {v.diocese && ` · ${v.diocese}`}
                </div>
                {v.endorsed_at && (
                  <div className="mt-1 font-serif text-xs italic text-ink-muted">
                    Endorsed {new Date(v.endorsed_at).toLocaleDateString()}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function ReviewField({
  eyebrow,
  helper,
  value,
  rows,
  onChange,
}: {
  eyebrow: string;
  helper: string;
  value: string;
  rows: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold-600">
        {eyebrow}
      </div>
      <p className="font-serif text-sm italic text-ink-muted leading-relaxed">
        {helper}
      </p>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <Label className="block space-y-2">
      <span className="block">{label}</span>
      {helper && (
        <span className="block font-serif text-sm italic text-ink-muted">
          {helper}
        </span>
      )}
      {children}
    </Label>
  );
}
