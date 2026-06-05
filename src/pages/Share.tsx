import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { api } from "../lib/api";

interface SharedCommission {
  id: string;
  scope: string;
  patron_name: string;
  artist_id: string;
  stage: string;
  feast_name: string | null;
  artist_total_usd: number | null;
  certificate_title: string | null;
  messages: Array<{
    id: string;
    author_role: string;
    author_name: string;
    body: string;
    created_at: string;
  }>;
  wip: Array<{
    id: string;
    caption: string;
    palette_from: string | null;
    palette_to: string | null;
    posted_at: string;
  }>;
}

// /share/:token — public, read-only view of a commission. The patron
// shares this URL with family ("look at what's being made for our
// father's funeral"); recipients see the studio thread and the work
// as it comes, without sign-in.
export default function Share() {
  const { token = "" } = useParams<{ token: string }>();
  const [c, setC] = useState<SharedCommission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.sharedCommission(token);
      if (cancelled) return;
      if (!res.ok) {
        setNotFound(true);
      } else {
        setC(res.data.commission as SharedCommission);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <PageShell>
        <div className="container py-24 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-ink-muted" />
          <div className="font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
            Opening the share view…
          </div>
        </div>
      </PageShell>
    );
  }

  if (notFound || !c) {
    return (
      <PageShell>
        <section className="container py-24 max-w-xl text-center">
          <h1 className="font-display text-3xl text-ink">
            This share link is not valid.
          </h1>
          <p className="mt-3 font-serif text-ink-muted">
            The patron may have revoked it, or the link may have expired.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-burgundy-500"
          >
            Visit Locavit
          </Link>
        </section>
      </PageShell>
    );
  }

  const wipSorted = [...(c.wip ?? [])].sort(
    (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime(),
  );

  return (
    <PageShell>
      <Seo
        title="A commission in progress — Locavit"
        description="A shared view of a commission's studio thread and work in progress."
        path={`/share/${token}`}
        robots="noindex,nofollow"
      />
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Shared by the patron · read-only view
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-ink leading-[1.05]">
          {c.certificate_title ??
            c.scope.split("\n")[0]?.slice(0, 120) ??
            "A commission in progress"}
        </h1>
        {c.feast_name && (
          <p className="mt-2 font-serif text-base italic text-ink-muted">
            For {c.feast_name}
          </p>
        )}
        <Ornament className="my-8" />

        {wipSorted.length > 0 && (
          <section className="mb-12">
            <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
              From the studio
            </div>
            <ol className="space-y-5">
              {wipSorted.map((w) => (
                <li key={w.id} className="flex gap-3">
                  <div
                    className="h-14 w-14 shrink-0 rounded-sm ring-1 ring-ink/10"
                    style={{
                      background: `linear-gradient(135deg, ${w.palette_from ?? "#7a1f2c"}, ${w.palette_to ?? "#42101a"})`,
                    }}
                    aria-hidden
                  />
                  <div className="grow">
                    <div className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                      {new Date(w.posted_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <p className="mt-0.5 font-serif text-[15px] text-ink leading-snug">
                      {w.caption}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-3">
            The thread
          </div>
          <ol className="space-y-5">
            {(c.messages ?? [])
              .filter((m) => m.author_role !== "system")
              .map((m) => (
                <li key={m.id} className="">
                  <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                    {m.author_role === "artist" ? "The artist" : "The patron"} ·{" "}
                    {new Date(m.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div
                    className={
                      "mt-1 inline-block rounded-md px-3 py-2 " +
                      (m.author_role === "artist"
                        ? "bg-lapis-600/10 text-ink"
                        : "bg-burgundy-500/10 text-ink")
                    }
                  >
                    <p className="font-serif text-[15px] leading-relaxed whitespace-pre-line">
                      {m.body}
                    </p>
                  </div>
                </li>
              ))}
          </ol>
        </section>

        <Ornament className="my-12" />
        <p className="font-serif italic text-sm text-ink-muted text-center">
          You are seeing this because the patron shared it. The view is
          read-only; no actions on this page change the commission.
        </p>
      </section>
    </PageShell>
  );
}
