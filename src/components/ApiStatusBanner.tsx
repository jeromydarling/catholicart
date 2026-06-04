import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { api } from "../lib/api";

// Lightweight banner that pings /api/health + /api/categories on mount.
// If the API is up but D1 is empty, shows a non-intrusive note about
// running the bootstrap workflow. Silent on the happy path.

const KEY = "ars-sacra:api-banner-dismissed";

export function ApiStatusBanner() {
  const [state, setState] = useState<"loading" | "ok" | "no-db" | "down">(
    "loading",
  );
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const h = await api.health();
      if (cancelled) return;
      if (!h.ok) {
        setState("down");
        return;
      }
      const cats = await api.categories();
      if (cancelled) return;
      if (!cats.ok || (cats.data.categories?.length ?? 0) === 0) {
        setState("no-db");
        return;
      }
      setState("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || state === "loading" || state === "ok") return null;

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div className="bg-burgundy-500/8 border-b border-burgundy-500/20">
      <div className="container py-2.5 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-burgundy-500 shrink-0 mt-0.5" />
        <div className="grow text-sm font-serif text-ink-soft leading-snug">
          {state === "down" ? (
            <>
              The API is unreachable. The Worker may still be deploying — try
              again in a minute.
            </>
          ) : (
            <>
              The database is empty. Run the{" "}
              <a
                href="https://github.com/jeromydarling/catholicart/actions/workflows/cf-bootstrap-cloud.yml"
                target="_blank"
                rel="noreferrer"
                className="underline text-burgundy-500 hover:text-burgundy-600"
              >
                Cloudflare bootstrap workflow
              </a>{" "}
              once to create D1 + R2 + KV and apply migrations. The
              localStorage prototype keeps working in the meantime.
            </>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="h-7 w-7 grid place-items-center text-ink-muted hover:text-ink rounded-sm shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Suppress unused-Link warning for editor — kept around for future
// in-page navigation use.
Link;
