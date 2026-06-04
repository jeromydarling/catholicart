import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, RefreshCw, Send, Trash2 } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  getOutbox,
  subscribeOutbox,
  clearOutbox,
} from "../lib/email/notify";
import type { OutboxEntry } from "../lib/email/types";

// /outbox — dev-only viewer for every email the platform would have
// sent. In production the same data lives in the D1 `outbox` table,
// dispatched via the Cloudflare Email Service `send_email` binding;
// during the prototype this is how we audit triggers, proofread copy,
// and verify suppression of unsubscribed recipients.
export default function Outbox() {
  const [entries, setEntries] = useState<OutboxEntry[]>(() => getOutbox());
  const [selected, setSelected] = useState<OutboxEntry | null>(null);

  useEffect(() => {
    const unsub = subscribeOutbox(() => setEntries(getOutbox()));
    return unsub;
  }, []);

  useEffect(() => {
    if (!selected && entries[0]) setSelected(entries[0]);
  }, [entries, selected]);

  return (
    <PageShell>
      <section className="container pt-10 sm:pt-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          Dev tool · outbox
        </div>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
              Every email the platform sends.
            </h1>
            <p className="mt-2 font-serif text-base text-ink-muted max-w-2xl">
              Each state transition fires a notification. In dev these land
              here. In production they dispatch via Cloudflare Email Service.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEntries(getOutbox())}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearOutbox();
                setSelected(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </div>
        <Ornament className="my-8" />
      </section>

      <section className="container grid lg:grid-cols-12 gap-8 pb-20">
        {/* Index */}
        <aside className="lg:col-span-4 space-y-2">
          {entries.length === 0 ? (
            <div className="rounded-md border border-dashed border-ink/15 p-8 text-center">
              <Mail className="h-5 w-5 mx-auto text-ink-muted" />
              <p className="mt-3 font-serif text-sm text-ink-muted">
                The outbox is empty. Trigger a state change anywhere in the
                app and it'll appear here.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/browse">Browse the guild</Link>
              </Button>
            </div>
          ) : (
            entries.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className={
                  "block w-full text-left rounded-md border p-3 sm:p-4 focusable transition-colors " +
                  (selected?.id === e.id
                    ? "border-burgundy-500/40 bg-burgundy-500/5"
                    : "border-ink/10 bg-parchment-50 hover:bg-parchment-100")
                }
              >
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <Badge
                    variant={
                      e.category === "transactional"
                        ? "burgundy"
                        : e.category === "milestone"
                          ? "lapis"
                          : e.category === "digest"
                            ? "olive"
                            : "gold"
                    }
                  >
                    {e.category}
                  </Badge>
                  <div className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted tabular-nums">
                    {formatStamp(e.createdAt)}
                  </div>
                </div>
                <div className="mt-2 font-display text-base text-ink leading-tight line-clamp-2">
                  {e.rendered.subject}
                </div>
                <div className="mt-1 font-sans text-xs text-ink-muted line-clamp-1">
                  → {e.recipients.map((r) => r.email).join(", ")}
                </div>
                {e.status === "skipped-unsubscribed" && (
                  <div className="mt-2 font-sans text-[10px] uppercase tracking-[0.18em] text-burgundy-500">
                    Suppressed · recipient unsubscribed
                  </div>
                )}
              </button>
            ))
          )}
        </aside>

        {/* Preview */}
        <main className="lg:col-span-8">
          {selected ? (
            <div className="rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-ink/10 bg-parchment-100/60">
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
                  Subject
                </div>
                <div className="mt-1 font-display text-xl text-ink leading-tight">
                  {selected.rendered.subject}
                </div>
                <div className="mt-3 font-sans text-xs text-ink-muted">
                  <div>
                    <strong className="text-ink-soft">To:</strong>{" "}
                    {selected.recipients
                      .map((r) => `${r.name ?? r.email} <${r.email}>`)
                      .join(", ")}
                  </div>
                  <div className="mt-1">
                    <strong className="text-ink-soft">Preheader:</strong>{" "}
                    <em>{selected.rendered.preheader}</em>
                  </div>
                  <div className="mt-1">
                    <strong className="text-ink-soft">Event:</strong>{" "}
                    <code className="font-mono text-[11px] bg-parchment-100 px-1.5 py-0.5 rounded">
                      {selected.event.kind}
                    </code>{" "}
                    · <Badge variant="outline">{selected.category}</Badge>
                  </div>
                </div>
              </div>
              <iframe
                title="Email preview"
                srcDoc={selected.rendered.html}
                sandbox=""
                className="w-full h-[640px] bg-parchment-100"
              />
              <details className="p-5 sm:p-6 border-t border-ink/10">
                <summary className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted cursor-pointer">
                  <Send className="inline h-3 w-3 mr-1.5" /> Plain-text fallback
                </summary>
                <pre className="mt-3 font-mono text-xs whitespace-pre-wrap text-ink-soft">
                  {selected.rendered.text}
                </pre>
              </details>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-ink/15 p-12 text-center">
              <p className="font-serif text-ink-muted">
                Pick an email on the left to preview.
              </p>
            </div>
          )}
        </main>
      </section>
    </PageShell>
  );
}

function formatStamp(iso: string) {
  const t = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - t.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  return t.toLocaleDateString();
}
