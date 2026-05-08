import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, ShieldCheck, XCircle, MessageSquare } from "lucide-react";
import { brand } from "../data/brand";
import { artists } from "../data/artists";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { cn, initials } from "../lib/utils";
import type { Verification, VerifierRole } from "../types";

const ROLE_LABEL: Record<VerifierRole, string> = {
  pastor: "Pastor",
  "religious-superior": "Religious superior",
  chaplain: "Chaplain",
  chancery: "Chancery",
};

const QUESTION: Record<VerifierRole, string> = {
  pastor:
    "Do you affirm that this person is a parishioner here in good standing, and that you support their work as a Catholic artist?",
  "religious-superior":
    "Do you affirm that this person is a member of your community in good standing, and that you support their work?",
  chaplain:
    "Do you affirm that this person is under your pastoral care and is a Catholic in good standing?",
  chancery:
    "Do you affirm that this person is a Catholic in good standing within your diocese?",
};

export default function Verify() {
  const { token = "" } = useParams<{ token: string }>();
  const { getVerificationByToken, priestRespond } = useStore();
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState<
    "endorsed" | "declined" | "discuss" | null
  >(null);

  // Look up the verification by token. Also support a simulated demo
  // where the artist's seed verification can be re-clicked.
  const verification = useMemo(
    () => getVerificationByToken(token),
    [token, getVerificationByToken],
  );

  if (!token || !verification) {
    return (
      <NotFoundShell
        title="This endorsement link is not valid."
        body="The link may have expired or been used. If you believe this is in error, contact the guild."
      />
    );
  }

  // For prototype, we connect the verification to the most recent applicant
  // (the simulated artist). Their info is in the signedUpArtist record.
  const applicant = usePresumedApplicant(verification);

  function respond(action: "endorse" | "decline" | "discuss") {
    priestRespond(token, action, notes.trim() || undefined);
    setConfirmed(
      action === "endorse"
        ? "endorsed"
        : action === "decline"
          ? "declined"
          : "discuss",
    );
    window.scrollTo({ top: 0 });
  }

  if (
    confirmed ||
    verification.status === "endorsed" ||
    verification.status === "endorsed-chancery-pending" ||
    verification.status === "declined" ||
    verification.status === "discuss" ||
    verification.status === "chancery-confirmed"
  ) {
    return (
      <ConfirmationShell verification={verification} confirmed={confirmed} />
    );
  }

  return (
    <VerifyShell>
      <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-burgundy-500 mb-3">
        Endorsement Request
      </div>
      <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-ink leading-[1.1]">
        For{" "}
        <span className="italic text-burgundy-500">
          {verification.verifierName}
        </span>
      </h1>
      <p className="mt-2 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
        {ROLE_LABEL[verification.role]} ·{" "}
        {verification.parishOrCommunity}
      </p>

      <Ornament className="my-8" />

      <p className="font-serif text-lg text-ink leading-relaxed">
        <strong className="font-medium">{applicant.name}</strong>{" "}
        {applicant.location && (
          <span className="text-ink-muted">({applicant.location})</span>
        )}{" "}
        has applied to <strong className="font-medium">{brand.name}</strong>,
        a guild for Catholic artists who take commissions from the faithful.
        We list only artists who have been{" "}
        <strong className="font-medium">vouched-for by their pastor</strong>{" "}
        — or by a religious superior, chaplain, or chancery. We are writing
        to ask if you will endorse this applicant.
      </p>

      {/* Applicant card */}
      <div className="mt-8 rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-0">
          <div
            className="aspect-square sm:w-40 sm:h-40 grid place-items-center"
            style={{
              background: applicant.portrait,
            }}
          >
            <span className="font-display text-3xl sm:text-4xl text-parchment-50/95">
              {initials(applicant.name)}
            </span>
          </div>
          <div className="p-5 grow">
            <div className="font-display text-2xl text-ink">
              {applicant.name}
            </div>
            <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              {applicant.craft}
              {applicant.location ? ` · ${applicant.location}` : ""}
            </div>
            {applicant.vocationStatement && (
              <p className="mt-3 font-serif italic text-base text-ink-soft leading-snug">
                &ldquo;{applicant.vocationStatement}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl sm:text-2xl text-ink leading-snug">
        {QUESTION[verification.role]}
      </h2>

      <div className="mt-3 grid gap-2">
        <p className="font-serif text-sm text-ink-muted leading-relaxed">
          Your name and parish will be displayed on{" "}
          {applicant.firstName}&rsquo;s public profile (e.g.{" "}
          <em>
            &ldquo;Endorsed by {verification.verifierName} ·{" "}
            {verification.parishOrCommunity}&rdquo;
          </em>
          ).
        </p>
        <p className="font-serif text-sm text-ink-muted leading-relaxed">
          You may revoke this endorsement at any time by returning to this
          link. We will ask you to re-confirm in 12 months.
        </p>
      </div>

      <div className="mt-6">
        <label className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Notes (private to {brand.name}, optional)
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-2"
          placeholder="Any context you want us to know."
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Button
          size="lg"
          className="bg-olive-500 hover:bg-olive-600 text-parchment-50"
          onClick={() => respond("endorse")}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          I endorse
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => respond("discuss")}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Discuss first
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-burgundy-500/40 text-burgundy-500 hover:bg-burgundy-500/5"
          onClick={() => respond("decline")}
        >
          <XCircle className="h-4 w-4 mr-2" />
          I do not endorse
        </Button>
      </div>

      <div className="mt-12 pt-6 border-t border-ink/10">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-gold-600 shrink-0 mt-1" />
          <div className="font-serif text-sm text-ink-muted leading-relaxed">
            This link is single-use, scoped to{" "}
            <strong className="font-medium">{applicant.name}</strong>&rsquo;s
            application only. If you are not{" "}
            <strong className="font-medium">
              {verification.verifierName}
            </strong>{" "}
            of {verification.parishOrCommunity}, please ignore this email and
            let us know.
          </div>
        </div>
      </div>
    </VerifyShell>
  );
}

function ConfirmationShell({
  verification,
  confirmed,
}: {
  verification: Verification;
  confirmed: "endorsed" | "declined" | "discuss" | null;
}) {
  // Treat just-clicked + persisted state the same way.
  const status = verification.status;
  const isEndorsed =
    confirmed === "endorsed" ||
    status === "endorsed" ||
    status === "endorsed-chancery-pending" ||
    status === "chancery-confirmed";
  const isDeclined = confirmed === "declined" || status === "declined";
  const isDiscuss = confirmed === "discuss" || status === "discuss";

  return (
    <VerifyShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {isEndorsed ? (
          <>
            <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-olive-500/15 text-olive-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-7 font-display text-3xl sm:text-4xl text-ink">
              Endorsement recorded.
            </h1>
            <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
              Thank you, {verification.verifierName}. We&rsquo;ll re-confirm
              with you in 12 months. You may revoke at any time by returning
              to this link.
            </p>
            {verification.verifierEmailIsFreeWebmail && (
              <div className="mt-6 mx-auto max-w-md rounded-md border border-gold-500/30 bg-gold-500/5 p-4 text-left">
                <p className="font-serif text-sm text-ink-soft leading-relaxed">
                  Because this endorsement came from a free-webmail address,
                  we are also reaching out to your{" "}
                  <strong className="font-medium">diocesan chancery</strong>{" "}
                  to confirm. The applicant&rsquo;s profile will show
                  &ldquo;pending chancery confirmation&rdquo; until they
                  reply.
                </p>
              </div>
            )}
          </>
        ) : isDiscuss ? (
          <>
            <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-gold-500/15 text-gold-600">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h1 className="mt-7 font-display text-3xl sm:text-4xl text-ink">
              We&rsquo;ll be in touch.
            </h1>
            <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
              Thank you. A guild reader will reach out to discuss before any
              endorsement is recorded.
            </p>
          </>
        ) : isDeclined ? (
          <>
            <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-burgundy-500/10 text-burgundy-500">
              <XCircle className="h-7 w-7" />
            </div>
            <h1 className="mt-7 font-display text-3xl sm:text-4xl text-ink">
              Decline recorded.
            </h1>
            <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
              Thank you for your honesty. The application will not proceed
              based on your decision.
            </p>
          </>
        ) : null}

        <Ornament className="my-10" />

        <p className="font-serif italic text-sm text-ink-muted">
          {brand.motto}
        </p>
      </motion.div>
    </VerifyShell>
  );
}

function NotFoundShell({ title, body }: { title: string; body: string }) {
  return (
    <VerifyShell>
      <div className="text-center">
        <h1 className="font-display text-4xl text-ink">{title}</h1>
        <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
          {body}
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/">Return home</Link>
        </Button>
      </div>
    </VerifyShell>
  );
}

function VerifyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment-50">
      <div className="border-b border-ink/10 bg-parchment-50/85 backdrop-blur-md sticky top-0 z-10">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl text-ink">
            {brand.name}
          </Link>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
            Endorsement
          </div>
        </div>
      </div>
      <main className="container py-10 sm:py-16 max-w-2xl">{children}</main>
    </div>
  );
}

// In production this would come from a database join. For the prototype,
// we synthesize an applicant from the most recent signed-up artist (the
// simulated user filling the application) — or, if the verification was
// generated from a seed artist, look it up by token in artists data.
function usePresumedApplicant(verification: Verification): {
  name: string;
  firstName: string;
  location?: string;
  craft: string;
  vocationStatement?: string;
  portrait: string;
} {
  const { signedUpArtist } = useStore();

  // Try seed artists first (their verifications carry stable tokens
  // generated at module load — see data/artists.ts).
  const seed = artists.find((a) => a.verification?.token === verification.token);
  if (seed) {
    return {
      name: `${seed.honorific ? `${seed.honorific} ` : ""}${seed.name}`,
      firstName: seed.name.split(" ")[0],
      location: seed.city,
      craft: seed.categories[0]?.replace(/-/g, " ") ?? "Catholic artist",
      vocationStatement: seed.vocationStatement,
      portrait: `linear-gradient(135deg, ${seed.portraitFrom}, ${seed.portraitTo})`,
    };
  }

  // Otherwise, the applicant is the simulated current user.
  const name = signedUpArtist?.name || "the applicant";
  return {
    name,
    firstName: name.split(" ")[0] || "the applicant",
    craft: "Catholic artist",
    portrait: `linear-gradient(135deg, #5e1623, #876b2c)`,
  };
}
