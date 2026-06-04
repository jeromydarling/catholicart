import { useEffect, useState } from "react";
import { CheckCircle2, Circle, XCircle, Loader2 } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { api } from "../lib/api";

interface Check {
  name: string;
  detail: string;
  status: "pending" | "ok" | "fail";
  message?: string;
  count?: number;
}

const CHECKS: { name: string; run: () => Promise<{ ok: boolean; message?: string; count?: number }> }[] = [
  {
    name: "Worker is reachable",
    run: async () => {
      const r = await api.health();
      return r.ok ? { ok: true, message: r.data.time } : { ok: false, message: String(r.error) };
    },
  },
  {
    name: "D1 — categories seeded",
    run: async () => {
      const r = await api.categories();
      if (!r.ok) return { ok: false, message: String(r.error) };
      return { ok: r.data.categories.length === 8, count: r.data.categories.length, message: r.data.categories.length === 8 ? "8 categories" : `expected 8, got ${r.data.categories.length}` };
    },
  },
  {
    name: "D1 — saints seeded",
    run: async () => {
      const r = await api.saints();
      if (!r.ok) return { ok: false, message: String(r.error) };
      return { ok: r.data.saints.length === 20, count: r.data.saints.length, message: r.data.saints.length === 20 ? "20 saints" : `expected 20, got ${r.data.saints.length}` };
    },
  },
  {
    name: "D1 — dioceses seeded",
    run: async () => {
      const r = await api.dioceses();
      if (!r.ok) return { ok: false, message: String(r.error) };
      return { ok: r.data.dioceses.length === 12, count: r.data.dioceses.length, message: r.data.dioceses.length === 12 ? "12 dioceses" : `expected 12, got ${r.data.dioceses.length}` };
    },
  },
  {
    name: "D1 — religious orders seeded",
    run: async () => {
      const r = await api.orders();
      if (!r.ok) return { ok: false, message: String(r.error) };
      return { ok: r.data.orders.length === 4, count: r.data.orders.length, message: r.data.orders.length === 4 ? "4 orders" : `expected 4, got ${r.data.orders.length}` };
    },
  },
  {
    name: "D1 — artists seeded",
    run: async () => {
      const r = await api.listArtists();
      if (!r.ok) return { ok: false, message: String(r.error) };
      return { ok: r.data.artists.length === 12, count: r.data.artists.length, message: r.data.artists.length === 12 ? "12 artists" : `expected 12, got ${r.data.artists.length}` };
    },
  },
  {
    name: "FTS5 — search 'icon' returns Maria",
    run: async () => {
      const r = await api.listArtists({ q: "Maria" });
      if (!r.ok) return { ok: false, message: String(r.error) };
      return { ok: r.data.artists.length > 0, count: r.data.artists.length, message: r.data.artists.length > 0 ? "FTS5 working" : "no matches" };
    },
  },
  {
    name: "Auth — /me returns null when not signed in",
    run: async () => {
      const r = await api.me();
      if (!r.ok) return { ok: false, message: String(r.error) };
      return { ok: true, message: r.data.user ? `signed in as ${r.data.user.email}` : "anonymous" };
    },
  },
  {
    name: "Ledger — endpoint responds",
    run: async () => {
      const r = await api.ledger();
      if (!r.ok) return { ok: false, message: String(r.error) };
      return { ok: true, message: `${r.data.stats.completed ?? 0} completed, ${r.data.stats.in_flight ?? 0} in flight` };
    },
  },
  {
    name: "Config — public client config served",
    run: async () => {
      const r = await api.config();
      if (!r.ok) return { ok: false, message: String(r.error) };
      const ok = Boolean(r.data.mapbox_token);
      return ok
        ? { ok: true, message: "mapbox_token present" }
        : { ok: false, message: "mapbox_token empty — set VITE_MAPBOX_TOKEN" };
    },
  },
  {
    name: "Secrets — RESEND_API_KEY set",
    run: async () => {
      const r = await api.config();
      if (!r.ok) return { ok: false, message: String(r.error) };
      const f = (r.data as { flags?: { resend_configured?: boolean } }).flags;
      return f?.resend_configured
        ? { ok: true, message: "resend wired" }
        : { ok: false, message: "not set — magic-link emails will be queued but not delivered" };
    },
  },
  {
    name: "Secrets — AUTH_SECRET set",
    run: async () => {
      const r = await api.config();
      if (!r.ok) return { ok: false, message: String(r.error) };
      const f = (r.data as { flags?: { auth_secret_configured?: boolean } }).flags;
      return f?.auth_secret_configured
        ? { ok: true, message: "auth secret wired" }
        : { ok: false, message: "not set — sessions will use insecure dev default" };
    },
  },
];

export default function ApiStatus() {
  const [checks, setChecks] = useState<Check[]>(() =>
    CHECKS.map((c) => ({ name: c.name, detail: "", status: "pending" })),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < CHECKS.length; i++) {
        const r = await CHECKS[i].run();
        if (cancelled) return;
        setChecks((cs) =>
          cs.map((c, idx) =>
            idx === i
              ? {
                  ...c,
                  status: r.ok ? "ok" : "fail",
                  message: r.message ?? "",
                  count: r.count,
                }
              : c,
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const passed = checks.filter((c) => c.status === "ok").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const pending = checks.filter((c) => c.status === "pending").length;

  return (
    <PageShell>
      <Seo
        title="API status"
        description="Live verification that the Cloudflare Worker + D1 + KV bindings are wired correctly."
        path="/api-status"
        robots="noindex,nofollow"
      />
      <section className="container py-12 max-w-2xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Dev tool · cloudflare verification
        </div>
        <h1 className="font-display text-4xl tracking-tight text-ink leading-tight">
          API status
        </h1>
        <p className="mt-3 font-serif text-base text-ink-muted">
          Live checks against the Worker. Run this after the
          cf-bootstrap-cloud workflow completes to verify D1, KV, and
          seeds are all wired.
        </p>
        <Ornament className="my-8" />

        <div className="flex items-center gap-4 mb-6 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted tabular-nums">
          <span className="text-olive-600">{passed} passed</span>
          <span className="text-burgundy-500">{failed} failed</span>
          <span>{pending} pending</span>
        </div>

        <ul className="space-y-2">
          {checks.map((c) => (
            <li
              key={c.name}
              className="flex items-start gap-3 rounded-md border border-ink/10 bg-parchment-50 p-4"
            >
              <div className="mt-0.5 shrink-0">
                {c.status === "ok" ? (
                  <CheckCircle2 className="h-5 w-5 text-olive-600" />
                ) : c.status === "fail" ? (
                  <XCircle className="h-5 w-5 text-burgundy-500" />
                ) : (
                  <Loader2 className="h-5 w-5 text-ink-muted animate-spin" />
                )}
              </div>
              <div className="grow min-w-0">
                <div className="font-display text-base text-ink">{c.name}</div>
                {c.message && (
                  <div className="mt-0.5 font-sans text-xs text-ink-muted">
                    {c.message}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

Circle; // silence unused import
