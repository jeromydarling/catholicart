// Public notify() API. In dev: stores rendered emails in a localStorage
// outbox so they can be inspected at /outbox. In production: posts to a
// Supabase edge function that fans out through Resend.

import type {
  EmailEvent,
  OutboxEntry,
  EmailPreferences,
} from "./types";
import { defaultPreferences } from "./types";
import { renderEmail } from "./templates";

const OUTBOX_KEY = "ars-sacra:outbox";
const PREFS_KEY = "ars-sacra:email-prefs";

// ── Outbox storage ──────────────────────────────────────────
function loadOutbox(): OutboxEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as OutboxEntry[]) : [];
  } catch {
    return [];
  }
}
function saveOutbox(entries: OutboxEntry[]) {
  try {
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

const subscribers = new Set<() => void>();
function notifySubscribers() {
  subscribers.forEach((fn) => fn());
}
export function subscribeOutbox(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getOutbox(): OutboxEntry[] {
  return loadOutbox();
}

export function clearOutbox() {
  saveOutbox([]);
  notifySubscribers();
}

// ── Email preferences ───────────────────────────────────────
function loadPrefs(): Record<string, EmailPreferences> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, EmailPreferences>) : {};
  } catch {
    return {};
  }
}
function savePrefs(prefs: Record<string, EmailPreferences>) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function getPreferences(email: string): EmailPreferences {
  const all = loadPrefs();
  return all[email.toLowerCase()] ?? defaultPreferences(email.toLowerCase());
}

export function setPreferences(p: EmailPreferences) {
  const all = loadPrefs();
  all[p.email.toLowerCase()] = { ...p, updatedAt: new Date().toISOString() };
  savePrefs(all);
}

// ── Core: notify() ──────────────────────────────────────────
//
// Renders the event, checks per-recipient preferences, and pushes to
// the outbox. Returns the entry so callers can chain.
export function notify(event: EmailEvent): OutboxEntry {
  const { recipients, category, rendered } = renderEmail(event);

  // Filter out unsubscribed recipients (transactional always sends).
  const filtered = recipients.filter((r) => {
    if (category === "transactional") return true;
    const p = getPreferences(r.email);
    if (p.unsubscribeAll) return false;
    if (category === "milestone" && !p.milestone) return false;
    if (category === "digest" && !p.digest) return false;
    if (category === "marketing" && !p.marketing) return false;
    return true;
  });

  const entry: OutboxEntry = {
    id: `out_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    event,
    recipients: filtered.length ? filtered : recipients,
    rendered,
    category,
    status: filtered.length === 0 ? "skipped-unsubscribed" : "sent",
  };

  const outbox = loadOutbox();
  outbox.unshift(entry);
  // Cap at 200 to keep localStorage small.
  if (outbox.length > 200) outbox.length = 200;
  saveOutbox(outbox);
  notifySubscribers();

  return entry;
}
