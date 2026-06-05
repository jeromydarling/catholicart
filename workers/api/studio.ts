// Studio visits — the artist publishes open hours; patrons book a
// 20-minute video call. The artist confirms or declines. Small
// primitive; can grow into a real calendar later.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { all, first, newId, nowIso, run } from '../lib/db';
import { requireAuth } from '../lib/auth';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

async function artistOwner(env: Env, slug: string, user: { id: string; role: string }) {
  const a = await first<{ id: string; user_id: string | null }>(env.DB,
    `SELECT id, user_id FROM artists WHERE slug = ?`, slug);
  if (!a) return null;
  if (user.role === 'operator') return a;
  if (a.user_id === user.id) return a;
  return null;
}

// GET /api/studio/:slug/hours — public.
app.get('/:slug/hours', async (c) => {
  const slug = c.req.param('slug');
  const a = await first<{ id: string }>(c.env.DB,
    `SELECT id FROM artists WHERE slug = ?`, slug);
  if (!a) return c.json({ ok: false }, 404);
  const rows = await all(c.env.DB,
    `SELECT weekday, start_minute, end_minute, timezone, active
       FROM artist_open_hours
       WHERE artist_id = ? AND active = 1
       ORDER BY weekday, start_minute`,
    a.id);
  return c.json({ hours: rows });
});

// PUT /api/studio/:slug/hours — artist or operator replaces the
// schedule (atomic: delete + insert).
const HoursBody = z.object({
  timezone: z.string().min(1).max(80).default('UTC'),
  blocks: z.array(z.object({
    weekday: z.number().int().min(0).max(6),
    start_minute: z.number().int().min(0).max(1440),
    end_minute: z.number().int().min(0).max(1440),
  })).max(40),
});
app.put('/:slug/hours', requireAuth(), async (c) => {
  const u = c.var.user!;
  const slug = c.req.param('slug');
  const a = await artistOwner(c.env, slug, u);
  if (!a) return c.json({ ok: false, error: 'forbidden' }, 403);
  const parsed = HoursBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  await run(c.env.DB,
    `DELETE FROM artist_open_hours WHERE artist_id = ?`, a.id);
  for (const b of parsed.data.blocks) {
    if (b.end_minute <= b.start_minute) continue;
    await run(c.env.DB,
      `INSERT INTO artist_open_hours
         (id, artist_id, weekday, start_minute, end_minute, timezone, active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
      newId('hrs'), a.id, b.weekday, b.start_minute, b.end_minute,
      parsed.data.timezone);
  }
  return c.json({ ok: true });
});

// POST /api/studio/:slug/visits — patron requests a visit.
const VisitBody = z.object({
  patron_name: z.string().min(1).max(200),
  patron_email: z.string().email(),
  scheduled_at: z.string().datetime(),
  duration_min: z.number().int().min(10).max(120).default(20),
  note: z.string().max(2000).optional(),
});
app.post('/:slug/visits', async (c) => {
  const slug = c.req.param('slug');
  const a = await first<{ id: string }>(c.env.DB,
    `SELECT id FROM artists WHERE slug = ?`, slug);
  if (!a) return c.json({ ok: false }, 404);
  const parsed = VisitBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: parsed.error.flatten() }, 400);
  const id = newId('vis');
  await run(c.env.DB,
    `INSERT INTO studio_visits
       (id, artist_id, patron_id, patron_email, patron_name,
        scheduled_at, duration_min, note, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'requested')`,
    id, a.id, c.var.user?.id ?? null, parsed.data.patron_email,
    parsed.data.patron_name, parsed.data.scheduled_at,
    parsed.data.duration_min, parsed.data.note ?? null);
  return c.json({ ok: true, id });
});

// GET /api/studio/:slug/visits — artist or operator lists incoming requests.
app.get('/:slug/visits', requireAuth(), async (c) => {
  const u = c.var.user!;
  const slug = c.req.param('slug');
  const a = await artistOwner(c.env, slug, u);
  if (!a) return c.json({ ok: false, error: 'forbidden' }, 403);
  const rows = await all(c.env.DB,
    `SELECT id, patron_name, patron_email, scheduled_at, duration_min,
            note, status, created_at
       FROM studio_visits
       WHERE artist_id = ?
       ORDER BY scheduled_at DESC LIMIT 100`,
    a.id);
  return c.json({ visits: rows });
});

// PATCH /api/studio/visits/:id — artist or operator updates status.
const VisitStatus = z.object({
  status: z.enum(['confirmed', 'declined', 'completed', 'cancelled']),
});
app.patch('/visits/:id', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = VisitStatus.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const v = await first<{ artist_id: string }>(c.env.DB,
    `SELECT artist_id FROM studio_visits WHERE id = ?`, id);
  if (!v) return c.json({ ok: false }, 404);
  if (u.role !== 'operator') {
    const a = await first<{ user_id: string | null }>(c.env.DB,
      `SELECT user_id FROM artists WHERE id = ?`, v.artist_id);
    if (!a || a.user_id !== u.id) {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }
  }
  await run(c.env.DB,
    `UPDATE studio_visits SET status = ? WHERE id = ?`,
    parsed.data.status, id);
  // Touch nowIso() so we have an audit timestamp if needed later.
  void nowIso();
  return c.json({ ok: true });
});

export default app;
