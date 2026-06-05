import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Mail } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Seo } from "../components/Seo";
import { api } from "../lib/api";

export default function SignIn() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    api.me().then((r) => {
      if (r.ok && r.data.user) setUser({ email: r.data.user.email });
    });
  }, []);

  const justSignedIn = params.get("auth") === "ok";
  const expired = params.get("auth") === "expired";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await api.login(email.trim());
    if (!res.ok) {
      setError(typeof res.error === "string" ? res.error : "Could not send sign-in link.");
      return;
    }
    setSubmitted(email.trim());
  }

  async function handleSignOut() {
    await api.logout();
    setUser(null);
  }

  return (
    <PageShell>
      <Seo
        title="Sign in"
        description="Sign in to Locavit via magic link. We don't use passwords."
        path="/signin"
        robots="noindex,nofollow"
      />
      <section className="container py-24 max-w-md">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Sign in
        </div>
        <h1 className="font-display text-4xl tracking-tight text-ink leading-tight">
          A passwordless guild.
        </h1>
        <p className="mt-3 font-serif text-base text-ink-muted">
          Tell us your email; we'll send you a one-click sign-in link. No
          passwords, ever.
        </p>
        <Ornament className="my-8" />

        {user ? (
          <div className="rounded-md border border-olive-500/30 bg-olive-500/5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-olive-600 shrink-0 mt-0.5" />
              <div className="grow">
                <div className="font-display text-lg text-ink">You're signed in.</div>
                <p className="mt-1 font-serif text-sm text-ink-muted">{user.email}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link to="/dashboard">Open dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-md border border-olive-500/30 bg-olive-500/5 p-5 sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-olive-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-display text-lg text-ink">Check your inbox.</div>
                    <p className="mt-1 font-serif text-sm text-ink-muted">
                      We sent a sign-in link to <strong>{submitted}</strong>. It's
                      good for 30 minutes and can only be used once.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                {expired && (
                  <div className="rounded-md border border-burgundy-500/30 bg-burgundy-500/5 p-3 font-serif text-sm text-ink-soft">
                    That link expired or had already been used. Request a new one below.
                  </div>
                )}
                {justSignedIn && (
                  <div className="rounded-md border border-olive-500/30 bg-olive-500/5 p-3 font-serif text-sm text-ink-soft">
                    You're signed in.
                  </div>
                )}
                <Label htmlFor="signin-email" className="block space-y-1.5">
                  <span className="block">Email address</span>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@parish.org"
                  />
                </Label>
                {error && (
                  <p className="font-serif text-sm text-burgundy-500">{error}</p>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={!email.trim()}>
                  <Mail className="h-4 w-4 mr-2" /> Send sign-in link
                </Button>
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                  Magic-link auth · no passwords, no tracking
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        )}
      </section>
    </PageShell>
  );
}
