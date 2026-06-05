// Pastor's one-click endorsement. Anyone holding the unique verification
// token can see the request page and answer — no account, no friction.
// The token itself is the only credential, so it must be hard to guess
// (we use crypto.randomUUID joined; ~128 bits of entropy).

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { all, first, nowIso, run } from '../lib/db';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// GET /api/verifications/:token — public. Returns the verification +
// the artist's display fields so the pastor can confirm who they are
// being asked to endorse.
app.get('/:token', async (c) => {
  const token = c.req.param('token');
  const v = await first<{
    id: string;
    artist_id: string;
    status: string;
    role: string;
    verifier_name: string;
    parish_or_community: string;
    diocese: string | null;
    expires_at: string | null;
    endorsed_at: string | null;
    notes: string | null;
  }>(
    c.env.DB,
    `SELECT id, artist_id, status, role, verifier_name, parish_or_community,
            diocese, expires_at, endorsed_at, notes
       FROM verifications WHERE token = ?`,
    token,
  );
  if (!v) return c.json({ ok: false, error: 'not found' }, 404);
  const artist = await first<{ id: string; slug: string; name: string; honorific: string | null; city: string; region: string }>(
    c.env.DB,
    `SELECT id, slug, name, honorific, city, region FROM artists WHERE id = ?`,
    v.artist_id,
  );
  return c.json({ verification: v, artist });
});

// POST /api/verifications/:token/respond — public.
// One body shape: { decision, name, notes? }. Decision ∈ endorsed|declined|discuss.
const RespondBody = z.object({
  decision: z.enum(['endorsed', 'declined', 'discuss']),
  name: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
});
app.post('/:token/respond', async (c) => {
  const token = c.req.param('token');
  const parsed = RespondBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: 'bad request' }, 400);

  // Read first so we can refuse if already responded, and to fetch
  // the role for the right status string.
  const v = await first<{
    id: string;
    status: string;
    role: string;
    expires_at: string | null;
  }>(
    c.env.DB,
    `SELECT id, status, role, expires_at FROM verifications WHERE token = ?`,
    token,
  );
  if (!v) return c.json({ ok: false, error: 'not found' }, 404);
  if (v.status !== 'pending') {
    return c.json({ ok: false, error: 'already responded' }, 409);
  }
  if (v.expires_at && new Date(v.expires_at).getTime() < Date.now()) {
    await run(c.env.DB,
      `UPDATE verifications SET status = 'expired' WHERE id = ?`, v.id);
    return c.json({ ok: false, error: 'expired' }, 410);
  }

  // For chancery role, an endorsement moves through an extra step
  // (existing schema: 'endorsed-chancery-pending'). For now we keep
  // the simple endorsed/declined/discuss mapping; the chancery flow
  // is its own feature (#19).
  const newStatus = parsed.data.decision;
  const safeName = parsed.data.name.replace(/[\r\n]/g, ' ').slice(0, 200);

  await run(c.env.DB,
    `UPDATE verifications
       SET status = ?,
           verifier_name = ?,
           notes = COALESCE(?, notes),
           endorsed_at = CASE WHEN ? = 'endorsed' THEN ? ELSE endorsed_at END
       WHERE id = ?`,
    newStatus, safeName, parsed.data.notes ?? null,
    newStatus, nowIso(),
    v.id,
  );

  return c.json({ ok: true, status: newStatus });
});

// Public list — useful for diagnostic only. Operator only.
app.get('/', async (c) => {
  if (c.var.user?.role !== 'operator') return c.json({ ok: false }, 403);
  const rows = await all(c.env.DB,
    `SELECT v.*, a.slug AS artist_slug, a.name AS artist_name
       FROM verifications v
       JOIN artists a ON a.id = v.artist_id
       ORDER BY v.created_at DESC LIMIT 200`);
  return c.json({ verifications: rows });
});

export default app;
