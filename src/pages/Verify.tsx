import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, MessageSquare, ShieldCheck, XCircle, Loader2 } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { brand } from "../data/brand";

interface VerificationView {
  id: string;
  artist_id: string;
  status: string;
  role: string;
  verifier_name: string;
  parish_or_community: string;
  diocese: string | null;
  expires_at: string | null;
  endorsed_at: string | null;
  notes: string | null;
}
interface ArtistView {
  id: string;
  slug: string;
  name: string;
  honorific: string | null;
  city: string;
  region: string;
}

type Decision = "endorsed" | "declined" | "discuss";

// The pastor / chancery / religious superior arrives here from an
// email. No account, no signup. They confirm who they are, choose
// endorse / decline / let's talk, and they're done.
export default function Verify() {
  const { token = "" } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<VerificationView | null>(null);
  const [artist, setArtist] = useState<ArtistView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/verifications/${encodeURIComponent(token)}`, {
          headers: { Accept: "application/json" },
        });
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          setError("This page could not be loaded. Try again later.");
          return;
        }
        const j = await res.json() as { verification: VerificationView; artist: ArtistView };
        setVerification(j.verification);
        setArtist(j.artist);
        if (j.verification.status !== "pending") {
          // Already answered — show the final state.
          setConfirmed(
            j.verification.status === "endorsed" ? "endorsed" :
            j.verification.status === "declined" ? "declined" :
            j.verification.status === "discuss" ? "discuss" : null,
          );
        }
        if (j.verification.verifier_name && j.verification.verifier_name !== "(awaiting reply)") {
          setName(j.verification.verifier_name);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  async function respond(decision: Decision) {
    if (!name.trim()) {
      setError("Please confirm your name first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/verifications/${encodeURIComponent(token)}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, name: name.trim(), notes: notes.trim() || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("The response did not save. Please try again.");
      return;
    }
    setConfirmed(decision);
  }

  if (loading) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-ink-muted" />
          <div className="font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
            Opening the endorsement page…
          </div>
        </div>
      </PageShell>
    );
  }

  if (notFound) {
    return (
      <PageShell>
        <Seo title="Endorsement link not valid" description="This page is for guild endorsement requests." path="/verify" robots="noindex,nofollow" />
        <section className="container py-24 max-w-xl text-center">
          <h1 className="font-display text-3xl text-ink">This endorsement link is not valid.</h1>
          <p className="mt-4 font-serif text-ink-muted">
            The link may have expired or already been used. If you believe this is in
            error, please write to the guild and we'll send a fresh one.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Visit Locavit</Link>
          </Button>
        </section>
      </PageShell>
    );
  }

  if (!verification || !artist) return null;

  const roleLabel =
    verification.role === "religious-superior" ? "religious superior" :
    verification.role === "chancery" ? "chancery" : "pastor";
  const safeArtist = `${artist.honorific ? artist.honorific + " " : ""}${artist.name}`;

  return (
    <PageShell>
      <Seo
        title={`Endorse ${safeArtist}? — ${brand.name}`}
        description="A guild artist has named you as a witness."
        path={`/verify/${token}`}
        robots="noindex,nofollow"
      />
      <section className="container pt-12 sm:pt-16 max-w-2xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Endorsement request
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          Would you endorse {safeArtist}?
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted leading-relaxed">
          {safeArtist} of {artist.city} has applied to the Locavit guild and
          named you as their {roleLabel} at <strong className="text-ink">{verification.parish_or_community}</strong>.
        </p>
        <Ornament className="my-8" />

        <AnimatePresence mode="wait">
          {confirmed ? (
            <ConfirmedState
              key="confirmed"
              decision={confirmed}
              artistName={safeArtist}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="rounded-md border border-ink/10 bg-parchment-50 p-5 sm:p-6">
                <div className="font-display text-lg text-ink">
                  Do you affirm that this person is a Catholic in good standing
                  within your community, and that you support their work as a
                  sacred artist?
                </div>
                <p className="mt-3 font-serif text-sm text-ink-soft italic leading-relaxed">
                  Your endorsement is a small act of vouchsafing — not a
                  guarantee, not a contract. It tells future patrons that a
                  priest, superior, or chancery knows this person and considers
                  them sound. You are under no obligation.
                </p>
              </div>

              <Label className="block space-y-2">
                <span className="block">Your name (as you'd want it shown)</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Fr. Daniel Walsh"
                  autoComplete="name"
                />
              </Label>

              <Label className="block space-y-2">
                <span className="block">
                  A brief note <span className="text-ink-muted font-normal">(optional)</span>
                </span>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="A line or two about how you know them, if you'd like."
                />
              </Label>

              {error && (
                <p className="font-serif text-sm text-burgundy-500">{error}</p>
              )}

              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                <Button
                  onClick={() => respond("endorsed")}
                  disabled={submitting || !name.trim()}
                  variant="gold"
                  className="w-full"
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  I endorse them
                </Button>
                <Button
                  onClick={() => respond("discuss")}
                  disabled={submitting || !name.trim()}
                  variant="outline"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Let's talk first
                </Button>
                <Button
                  onClick={() => respond("declined")}
                  disabled={submitting || !name.trim()}
                  variant="outline"
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  I cannot endorse
                </Button>
              </div>

              <p className="font-serif text-xs italic text-ink-muted">
                Your answer is final but never punitive. "I cannot endorse" or
                "let's talk first" simply pauses the artist's application — it
                does not flag them.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </PageShell>
  );
}

function ConfirmedState({ decision, artistName }: { decision: Decision; artistName: string }) {
  const tone =
    decision === "endorsed"
      ? { icon: <ShieldCheck className="h-6 w-6 text-olive-600" />, label: "Endorsement received", body: `Thank you. ${artistName} is now a verified member of the Locavit guild.` }
      : decision === "discuss"
        ? { icon: <MessageSquare className="h-6 w-6 text-gold-600" />, label: "Conversation requested", body: `Thank you. We've noted that you'd like to speak before endorsing. The guild operator will reach out, or you can write to hello@locavit.com.` }
        : { icon: <XCircle className="h-6 w-6 text-burgundy-500" />, label: "Endorsement declined", body: `Thank you for your honesty. ${artistName}'s application has been paused.` };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-md border border-ink/10 bg-parchment-50 p-6 sm:p-8 text-center"
    >
      <div className="inline-flex items-center gap-3 mb-3">
        {tone.icon}
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-ink-muted">
          {tone.label}
        </div>
      </div>
      <p className="mt-3 font-serif text-lg text-ink-soft leading-relaxed max-w-md mx-auto">
        {tone.body}
      </p>
    </motion.div>
  );
}
