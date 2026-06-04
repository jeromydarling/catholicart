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

function formatAddress(r: Recipient): string {
  return r.name ? `${r.name} <${r.email}>` : r.email;
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

  let status: 'sent' | 'failed' | 'skipped-unsubscribed' =
    recipients.length === 0 ? 'skipped-unsubscribed' : 'sent';
  let message_id: string | undefined;
  let failure: string | undefined;

  if (recipients.length > 0) {
    if (!env.EMAIL || typeof env.EMAIL.send !== 'function') {
      status = 'failed';
      failure = 'EMAIL binding missing — onboard the sending domain to Cloudflare Email Service';
    } else {
      try {
        const to = recipients.map(formatAddress);
        const result = await env.EMAIL.send({
          from: env.EMAIL_FROM,
          to: to.length === 1 ? to[0] : to,
          subject: event.rendered.subject,
          html: event.rendered.html,
          text: event.rendered.text,
        });
        message_id = result.messageId;
      } catch (e) {
        status = 'failed';
        failure = (e as Error).message ?? 'unknown send error';
      }
    }
  }

  // Audit log
  await env.DB
    .prepare(
      `INSERT INTO outbox
        (id, event_kind, event_payload, category, subject, preheader, recipients,
         rendered_html, rendered_text, status, resend_id, failure_reason, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      newId('out'),
      event.kind,
      JSON.stringify(event.payload),
      event.category,
      event.rendered.subject,
      event.rendered.preheader,
      JSON.stringify(recipients),
      event.rendered.html,
      event.rendered.text,
      status,
      message_id ?? null,
      failure ?? null,
      status === 'sent' ? nowIso() : null,
    )
    .run();

  return { ok: status !== 'failed', status, message_id, failure };
}
