import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { brand } from "../data/brand";
import { artists } from "../data/artists";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { initials } from "../lib/utils";
import type { Verification } from "../types";

export default function Chancery() {
  const { token = "" } = useParams<{ token: string }>();
  const { getVerificationByChanceryToken, chanceryRespond } = useStore();
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState<"confirm" | "decline" | null>(
    null,
  );

  const verification = useMemo(
    () => getVerificationByChanceryToken(token),
    [token, getVerificationByChanceryToken],
  );

  if (!token || !verification) {
    return (
      <ChanceryShell>
        <div className="text-center">
          <h1 className="font-display text-4xl text-ink">
            This chancery link is not valid.
          </h1>
          <p className="mt-3 font-serif text-base text-ink-muted">
            The link may have expired or been used.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </ChanceryShell>
    );
  }

  const applicant = usePresumedApplicant(verification);

  function respond(action: "confirm" | "decline") {
    chanceryRespond(token, action, notes.trim() || undefined);
    setConfirmed(action);
    window.scrollTo({ top: 0 });
  }

  if (
    confirmed ||
    verification.status === "chancery-confirmed" ||
    (verification.status === "declined" && verification.chanceryNotes)
  ) {
    return (
      <ChanceryShell>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {confirmed === "confirm" ||
          verification.status === "chancery-confirmed" ? (
            <>
              <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-olive-500/15 text-olive-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="mt-7 font-display text-3xl sm:text-4xl text-ink">
                Chancery confirmation recorded.
              </h1>
              <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
                Thank you. The applicant&rsquo;s profile is now active in
                {" "}
                {brand.name}.
              </p>
            </>
          ) : (
            <>
              <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-burgundy-500/10 text-burgundy-500">
                <XCircle className="h-7 w-7" />
              </div>
              <h1 className="mt-7 font-display text-3xl sm:text-4xl text-ink">
                Decline recorded.
              </h1>
              <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
                Thank you for your honesty. The application will not proceed.
              </p>
            </>
          )}
          <Ornament className="my-10" />
        </motion.div>
      </ChanceryShell>
    );
  }

  return (
    <ChanceryShell>
      <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-burgundy-500 mb-3">
        Chancery Confirmation
      </div>
      <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-ink leading-[1.1]">
        Confirm a parishioner&rsquo;s standing
      </h1>
      <p className="mt-2 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
        {verification.diocese ?? "Diocese"}
      </p>

      <Ornament className="my-8" />

      <p className="font-serif text-lg text-ink leading-relaxed">
        <strong className="font-medium">{applicant.name}</strong> has applied
        to <strong className="font-medium">{brand.name}</strong>. Their
        verifier,{" "}
        <strong className="font-medium">{verification.verifierName}</strong>{" "}
        ({verification.parishOrCommunity}), has{" "}
        {verification.endorsedAt ? (
          <span className="text-olive-600">already endorsed</span>
        ) : (
          <span className="text-ink-muted">not yet responded to</span>
        )}{" "}
        the application.
      </p>

      <p className="mt-4 font-serif text-base text-ink-soft leading-relaxed">
        Because the verifier&rsquo;s email address (
        <code className="font-mono text-sm bg-parchment-100 px-1.5 py-0.5 rounded">
          {verification.verifierEmail}
        </code>
        ) is on a free-webmail provider, we ask the chancery to confirm —
        from an institutional address — that{" "}
        <strong className="font-medium">{applicant.name}</strong> is a
        Catholic in good standing in your diocese, and that{" "}
        <strong className="font-medium">{verification.verifierName}</strong>{" "}
        is who they say they are.
      </p>

      {/* Applicant card */}
      <div className="mt-8 rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-0">
          <div
            className="aspect-square sm:w-32 sm:h-32 grid place-items-center"
            style={{ background: applicant.portrait }}
          >
            <span className="font-display text-3xl text-parchment-50/95">
              {initials(applicant.name)}
            </span>
          </div>
          <div className="p-5 grow font-serif text-sm text-ink-soft leading-relaxed">
            <div className="font-display text-xl text-ink not-italic">
              {applicant.name}
            </div>
            <div className="mt-2">
              <strong className="font-medium">Parish/community:</strong>{" "}
              {verification.parishOrCommunity}
            </div>
            <div className="mt-1">
              <strong className="font-medium">Verifier:</strong>{" "}
              {verification.verifierName}
            </div>
            {verification.parishWebsite && (
              <div className="mt-1">
                <strong className="font-medium">Parish website:</strong>{" "}
                <a
                  className="text-burgundy-500 hover:underline"
                  href={verification.parishWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {verification.parishWebsite}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <label className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Notes (private to {brand.name}, optional)
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-2"
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          className="bg-olive-500 hover:bg-olive-600 text-parchment-50"
          onClick={() => respond("confirm")}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          I confirm
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-burgundy-500/40 text-burgundy-500 hover:bg-burgundy-500/5"
          onClick={() => respond("decline")}
        >
          <XCircle className="h-4 w-4 mr-2" />
          I cannot confirm
        </Button>
      </div>

      <div className="mt-12 pt-6 border-t border-ink/10">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-gold-600 shrink-0 mt-1" />
          <div className="font-serif text-sm text-ink-muted leading-relaxed">
            This link is single-use, scoped to{" "}
            <strong className="font-medium">{applicant.name}</strong>&rsquo;s
            application only.
          </div>
        </div>
      </div>
    </ChanceryShell>
  );
}

function ChanceryShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment-50">
      <div className="border-b border-ink/10 bg-parchment-50/85 backdrop-blur-md sticky top-0 z-10">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl text-ink">
            {brand.name}
          </Link>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
            Chancery
          </div>
        </div>
      </div>
      <main className="container py-10 sm:py-16 max-w-2xl">{children}</main>
    </div>
  );
}

function usePresumedApplicant(verification: Verification): {
  name: string;
  portrait: string;
} {
  const { signedUpArtist } = useStore();
  const seed = artists.find((a) => a.verification?.token === verification.token);
  if (seed) {
    return {
      name: `${seed.honorific ? `${seed.honorific} ` : ""}${seed.name}`,
      portrait: `linear-gradient(135deg, ${seed.portraitFrom}, ${seed.portraitTo})`,
    };
  }
  return {
    name: signedUpArtist?.name || "the applicant",
    portrait: `linear-gradient(135deg, #5e1623, #876b2c)`,
  };
}
