// Ledger stats, email preferences, journal subscribe, apprenticeship
// application — small endpoints grouped here.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { all, first, newId, nowIso, run } from '../lib/db';
import { sendEmail } from '../lib/email';
import { welcomeSubscriber } from '../lib/email-templates';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ─── GET /api/ledger — public stats ─────────────────────────────────
app.get('/ledger', async (c) => {
  const completed = await first<{ count: number; to_artists: number; platform: number }>(
    c.env.DB,
    `SELECT
       COUNT(*) AS count,
       COALESCE(SUM(artist_total_usd), 0) AS to_artists,
       COALESCE(SUM(platform_fee_usd), 0) AS platform
     FROM commissions WHERE stage IN ('delivered','blessed')`,
  );
  const inFlight = await first<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) AS count FROM commissions WHERE stage NOT IN ('delivered','blessed','cancelled')`,
  );
  const held = await first<{ held: number }>(
    c.env.DB,
    `SELECT COALESCE(SUM(amount_usd), 0) AS held FROM commission_escrow WHERE status = 'held'`,
  );

  const commissions = await all(c.env.DB,
    `SELECT c.id, c.scope, c.stage, c.created_at, c.completed_at,
            c.artist_total_usd, c.platform_fee_usd, c.platform_fee_pct,
            c.certificate_serial, c.feast_name,
            a.slug AS artist_slug, a.name AS artist_name
     FROM commissions c JOIN artists a ON a.id = c.artist_id
     WHERE c.stage != 'cancelled'
     ORDER BY c.created_at DESC LIMIT 100`,
  );

  return c.json({
    stats: {
      completed: completed?.count ?? 0,
      in_flight: inFlight?.count ?? 0,
      to_artists: completed?.to_artists ?? 0,
      platform: completed?.platform ?? 0,
      held: held?.held ?? 0,
    },
    commissions,
  });
});

// ─── Email preferences (token-less; signed link semantics deferred) ─
app.get('/preferences/:email', async (c) => {
  const email = decodeURIComponent(c.req.param('email')).toLowerCase();
  const row = await first(c.env.DB,
    `SELECT * FROM email_preferences WHERE email = ?`, email);
  if (row) return c.json({ preferences: row });
  return c.json({
    preferences: {
      email,
      unsubscribe_all: 0,
      milestone: 1,
      digest: 1,
      marketing: 1,
      updated_at: nowIso(),
    },
  });
});

const PrefsBody = z.object({
  email: z.string().email(),
  unsubscribe_all: z.boolean(),
  milestone: z.boolean(),
  digest: z.boolean(),
  marketing: z.boolean(),
});
app.put('/preferences', async (c) => {
  const parsed = PrefsBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const d = parsed.data;
  await run(c.env.DB,
    `INSERT INTO email_preferences (email, unsubscribe_all, milestone, digest, marketing, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET
       unsubscribe_all = excluded.unsubscribe_all,
       milestone = excluded.milestone,
       digest = excluded.digest,
       marketing = excluded.marketing,
       updated_at = excluded.updated_at`,
    d.email.toLowerCase(), d.unsubscribe_all ? 1 : 0, d.milestone ? 1 : 0,
    d.digest ? 1 : 0, d.marketing ? 1 : 0, nowIso(),
  );
  return c.json({ ok: true });
});

// ─── Journal subscribe ──────────────────────────────────────────────
app.post('/subscribe', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) return c.json({ ok: false }, 400);

  // Default to all-subscribed
  await run(c.env.DB,
    `INSERT INTO email_preferences (email) VALUES (?) ON CONFLICT (email) DO NOTHING`,
    parsed.data.email.toLowerCase(),
  );

  const event = welcomeSubscriber(c.env.SITE_URL, parsed.data.email);
  await sendEmail(c.env, { kind: 'subscribe.journal', payload: { email: parsed.data.email }, ...event });
  return c.json({ ok: true });
});

// ─── Apprenticeship application ────────────────────────────────────
const ApprenticeBody = z.object({
  applicant_name: z.string().min(1),
  applicant_email: z.string().email(),
  applicant_age: z.number().int().optional(),
  craft: z.string(),
  desired_master_slug: z.string().optional(),
  parish_or_community: z.string().optional(),
  pastor_email: z.string().email().optional(),
  portfolio_url: z.string().optional(),
  letter: z.string().min(1),
});
app.post('/apprenticeships', async (c) => {
  const parsed = ApprenticeBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);

  let master_id: string | null = null;
  if (parsed.data.desired_master_slug) {
    const master = await first<{ id: string }>(c.env.DB,
      `SELECT id FROM artists WHERE slug = ?`, parsed.data.desired_master_slug);
    master_id = master?.id ?? null;
  }

  await run(c.env.DB,
    `INSERT INTO apprenticeships (
       id, applicant_name, applicant_email, applicant_age, craft, desired_master_id,
       parish_or_community, pastor_email, portfolio_url, letter, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
    newId('app'), parsed.data.applicant_name, parsed.data.applicant_email,
    parsed.data.applicant_age ?? null, parsed.data.craft, master_id,
    parsed.data.parish_or_community ?? null, parsed.data.pastor_email ?? null,
    parsed.data.portfolio_url ?? null, parsed.data.letter,
  );
  return c.json({ ok: true });
});

export default app;
