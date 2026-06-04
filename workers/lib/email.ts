// Cloudflare Email Service backed transactional email. Suppresses
// unsubscribed recipients for non-transactional categories, dispatches
// via `env.EMAIL.send()` (the `send_email` binding from
// wrangler.jsonc), and records the result in the `outbox` D1 table.

import type { Env } from '../types';
import { newId, nowIso } from './db';

export type EmailCategory =
  | 'transactional'
  | 'milestone'
  | 'digest'
  | 'marketing';

export interface Recipient {
  email: string;
  name?: string;
  role?: string;
}

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

export interface OutboxEvent {
  kind: string;
  payload: unknown;
  category: EmailCategory;
  recipients: Recipient[];
  rendered: RenderedEmail;
}

function sanitizeHeader(s: string, max = 200): string {
  return s.replace(/[\r\n]/g, ' ').slice(0, max);
}
function formatAddress(r: Recipient): string {
  const email = sanitizeHeader(r.email, 320);
  if (!r.name) return email;
  return `${sanitizeHeader(r.name, 100)} <${email}>`;
}

export async function sendEmail(env: Env, event: OutboxEvent): Promise<{
  ok: boolean;
  status: 'sent' | 'failed' | 'skipped-unsubscribed';
  message_id?: string;
  failure?: string;
}> {
  let recipients = [...event.recipients];

  // Suppress unsubscribed (non-transactional only)
  if (event.category !== 'transactional' && recipients.length > 0) {
    const lower = recipients.map((r) => r.email.toLowerCase());
    const placeholders = lower.map(() => '?').join(',');
    const { results } = await env.DB
      .prepare(
        `SELECT email, unsubscribe_all, milestone, digest, marketing
         FROM email_preferences WHERE email IN (${placeholders})`,
      )
      .bind(...lower)
      .all<{
        email: string;
        unsubscribe_all: number;
        milestone: number;
        digest: number;
        marketing: number;
      }>();
    const suppressed = new Set(
      (results ?? [])
        .filter((p) => {
          if (p.unsubscribe_all) return true;
          if (event.category === 'milestone' && !p.milestone) return true;
          if (event.category === 'digest' && !p.digest) return true;
          if (event.category === 'marketing' && !p.marketing) return true;
          return false;
        })
        .map((p) => p.email.toLowerCase()),
    );
    recipients = recipients.filter((r) => !suppressed.has(r.email.toLowerCase()));
  }

  // Audit-log-first pattern: write the outbox row as 'queued' BEFORE
  // attempting the send. After the send returns, UPDATE the row with
  // the outcome. If the worker is killed between send and update, we
  // still have a queued row to investigate; we never have a sent
  // email with no audit trail.
  const outId = newId('out');
  const subject = sanitizeHeader(event.rendered.subject, 250);
  const initialStatus: 'sent' | 'failed' | 'skipped-unsubscribed' | 'queued' =
    recipients.length === 0 ? 'skipped-unsubscribed' : 'queued';

  await env.DB
    .prepare(
      `INSERT INTO outbox
        (id, event_kind, event_payload, category, subject, preheader, recipients,
         rendered_html, rendered_text, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      outId,
      event.kind,
      JSON.stringify(event.payload),
      event.category,
      subject,
      event.rendered.preheader,
      JSON.stringify(recipients),
      event.rendered.html,
      event.rendered.text,
      initialStatus,
    )
    .run();

  if (recipients.length === 0) {
    return { ok: true, status: 'skipped-unsubscribed' };
  }

  let status: 'sent' | 'failed' = 'sent';
  let message_id: string | undefined;
  let failure: string | undefined;

  if (!env.EMAIL || typeof env.EMAIL.send !== 'function') {
    status = 'failed';
    failure = 'EMAIL binding missing — onboard the sending domain to Cloudflare Email Service';
  } else {
    try {
      const to = recipients.map(formatAddress);
      const result = await env.EMAIL.send({
        from: sanitizeHeader(env.EMAIL_FROM, 200),
        to: to.length === 1 ? to[0] : to,
        subject,
        html: event.rendered.html,
        text: event.rendered.text,
      });
      message_id = result.messageId;
    } catch (e) {
      status = 'failed';
      failure = (e as Error).message ?? 'unknown send error';
    }
  }

  await env.DB
    .prepare(
      `UPDATE outbox SET status = ?, resend_id = ?, failure_reason = ?, sent_at = ?
         WHERE id = ?`,
    )
    .bind(
      status,
      message_id ?? null,
      failure ?? null,
      status === 'sent' ? nowIso() : null,
      outId,
    )
    .run();

  return { ok: status !== 'failed', status, message_id, failure };
}
