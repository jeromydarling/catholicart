// Commission lifecycle: create, quote, fund, release, mark midpoint /
// final, post WIP, message, record blessing, cancel, dispute, review.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { all, first, newId, nowIso, run } from '../lib/db';
import { requireAuth } from '../lib/auth';
import { computePricing, PLATFORM_FEE_PCT } from '../lib/pricing';
import { sendEmail } from '../lib/email';
import { quoteSentToPatron } from '../lib/email-templates';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const CreateBody = z.object({
  artist_slug: z.string(),
  patron_name: z.string().min(1),
  patron_email: z.string().email(),
  setting: z.string().optional(),
  scope: z.string().min(1),
  category_slug: z.string().optional(),
  preferred_deadline: z.string().optional(),
  feast_slug: z.string().optional(),
  feast_name: z.string().optional(),
  feast_date: z.string().optional(),
  parish_or_chapel: z.string().optional(),
  diocese: z.string().optional(),
  ip_terms: z.enum(['patron-exclusive', 'shared-prints', 'artist-retains', 'shared-custom']).default('patron-exclusive'),
});

// POST /api/commissions  — patron creates a new commission request.
app.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateBody.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: parsed.error.flatten() }, 400);

  const artist = await first<{ id: string }>(
    c.env.DB, `SELECT id FROM artists WHERE slug = ?`, parsed.data.artist_slug,
  );
  if (!artist) return c.json({ ok: false, error: 'artist not found' }, 404);

  const id = newId('cmn');
  await run(
    c.env.DB,
    `INSERT INTO commissions (
       id, artist_id, patron_id, patron_name, patron_email,
       category_slug, setting, scope, preferred_deadline,
       feast_slug, feast_name, feast_date,
       parish_or_chapel, diocese, ip_terms, stage, platform_fee_pct
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scoping', ?)`,
    id,
    artist.id,
    c.var.user?.id ?? null,
    parsed.data.patron_name,
    parsed.data.patron_email,
    parsed.data.category_slug ?? null,
    parsed.data.setting ?? null,
    parsed.data.scope,
    parsed.data.preferred_deadline ?? null,
    parsed.data.feast_slug ?? null,
    parsed.data.feast_name ?? null,
    parsed.data.feast_date ?? null,
    parsed.data.parish_or_chapel ?? null,
    parsed.data.diocese ?? null,
    parsed.data.ip_terms,
    PLATFORM_FEE_PCT,
  );

  // System + patron message
  await run(
    c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, `${parsed.data.patron_name} sent a request. The artist will reply with a quote.`,
  );
  await run(
    c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'patron', ?, ?)`,
    newId('msg'), id, parsed.data.patron_name, parsed.data.scope,
  );

  const commission = await loadCommission(c.env.DB, id);
  return c.json({ commission });
});

// GET /api/commissions  — for the current signed-in user (patron or artist).
app.get('/', requireAuth(), async (c) => {
  const u = c.var.user!;
  const sql = u.role === 'operator'
    ? `SELECT * FROM commissions ORDER BY created_at DESC LIMIT 200`
    : `SELECT c.* FROM commissions c
       LEFT JOIN artists a ON a.id = c.artist_id
       WHERE c.patron_id = ? OR a.user_id = ?
       ORDER BY c.created_at DESC LIMIT 200`;
  const rows = u.role === 'operator'
    ? await all(c.env.DB, sql)
    : await all(c.env.DB, sql, u.id, u.id);
  return c.json({ commissions: rows });
});

// GET /api/commissions/:id — workspace details.
app.get('/:id', async (c) => {
  const c2 = await loadCommission(c.env.DB, c.req.param('id'));
  if (!c2) return c.json({ ok: false, error: 'not found' }, 404);
  return c.json({ commission: c2 });
});

// POST /api/commissions/:id/quote — artist sends a quote.
const QuoteBody = z.object({
  artist_total_usd: z.number().int().positive(),
  note: z.string().min(1),
});
app.post('/:id/quote', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = QuoteBody.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: parsed.error.flatten() }, 400);

  const cm = await first<{
    id: string; stage: string; patron_name: string; patron_email: string;
    artist_id: string;
  }>(c.env.DB, `SELECT id, stage, patron_name, patron_email, artist_id FROM commissions WHERE id = ?`, id);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (cm.stage !== 'scoping') return c.json({ ok: false, error: 'wrong stage' }, 400);

  const p = computePricing(parsed.data.artist_total_usd);

  await run(
    c.env.DB,
    `UPDATE commissions SET
       stage = 'awaiting-deposit',
       artist_quote_note = ?,
       artist_total_usd = ?,
       platform_fee_usd = ?,
       total_due_usd = ?,
       updated_at = ?
     WHERE id = ?`,
    parsed.data.note, p.artistTotalUsd, p.platformFeeUsd, p.totalDueUsd, nowIso(), id,
  );

  for (const m of p.escrow) {
    await run(
      c.env.DB,
      `INSERT INTO commission_escrow (id, commission_id, stage, label, pct, amount_usd, status)
       VALUES (?, ?, ?, ?, ?, ?, 'unfunded')`,
      newId('esc'), id, m.stage, m.label, m.pct, m.amountUsd,
    );
  }

  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', 'Artist', ?)`,
    newId('msg'), id, parsed.data.note,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, `Artist quoted $${p.artistTotalUsd.toLocaleString()}. Three milestones funded as work progresses.`,
  );

  // Email patron
  const artist = await first<{ name: string }>(c.env.DB, `SELECT name FROM artists WHERE id = ?`, cm.artist_id);
  const cmFull = await first<any>(c.env.DB, `SELECT * FROM commissions WHERE id = ?`, id);
  if (cmFull) {
    const event = quoteSentToPatron(c.env.SITE_URL, {
      id: cmFull.id,
      scope: cmFull.scope,
      patron_email: cmFull.patron_email,
      patron_name: cmFull.patron_name,
      artist_total_usd: cmFull.artist_total_usd,
      platform_fee_usd: cmFull.platform_fee_usd,
      total_due_usd: cmFull.total_due_usd,
      platform_fee_pct: cmFull.platform_fee_pct,
      artist_quote_note: cmFull.artist_quote_note,
    }, artist?.name ?? 'Artist');
    await sendEmail(c.env, { kind: 'commission.quoted', payload: { id }, ...event });
  }

  const updated = await loadCommission(c.env.DB, id);
  return c.json({ commission: updated });
});

// POST /api/commissions/:id/escrow/:stage/fund — patron funds a milestone.
app.post('/:id/escrow/:stage/fund', async (c) => {
  const id = c.req.param('id');
  const stage = c.req.param('stage');
  if (!['deposit', 'midpoint', 'final'].includes(stage)) {
    return c.json({ ok: false, error: 'bad stage' }, 400);
  }
  const milestone = await first<{ id: string; status: string }>(
    c.env.DB, `SELECT id, status FROM commission_escrow WHERE commission_id = ? AND stage = ?`, id, stage,
  );
  if (!milestone) return c.json({ ok: false, error: 'milestone not found' }, 404);
  if (milestone.status !== 'unfunded') return c.json({ ok: false, error: 'already funded' }, 400);

  await run(c.env.DB,
    `UPDATE commission_escrow SET status = 'held', funded_at = ? WHERE id = ?`,
    nowIso(), milestone.id,
  );

  // Stage transition: deposit funded → in-progress
  if (stage === 'deposit') {
    await run(c.env.DB, `UPDATE commissions SET stage = 'in-progress', updated_at = ? WHERE id = ?`, nowIso(), id);
  }

  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, `Funded the ${stage} milestone. Funds are held in escrow.`,
  );

  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/escrow/:stage/release — patron releases.
app.post('/:id/escrow/:stage/release', async (c) => {
  const id = c.req.param('id');
  const stage = c.req.param('stage');
  if (!['deposit', 'midpoint', 'final'].includes(stage)) {
    return c.json({ ok: false, error: 'bad stage' }, 400);
  }
  const milestone = await first<{ id: string; status: string; amount_usd: number }>(
    c.env.DB, `SELECT id, status, amount_usd FROM commission_escrow WHERE commission_id = ? AND stage = ?`, id, stage,
  );
  if (!milestone) return c.json({ ok: false, error: 'milestone not found' }, 404);

  // Auto-fund if not yet (so patron can release midpoint without a separate fund step)
  if (milestone.status === 'unfunded') {
    await run(c.env.DB,
      `UPDATE commission_escrow SET status = 'held', funded_at = ? WHERE id = ?`,
      nowIso(), milestone.id,
    );
  }

  await run(c.env.DB,
    `UPDATE commission_escrow SET status = 'released', released_at = ? WHERE id = ?`,
    nowIso(), milestone.id,
  );

  let nextStage: string | null = null;
  let completed: string | null = null;
  if (stage === 'midpoint') nextStage = 'in-progress';
  if (stage === 'final') {
    nextStage = 'delivered';
    completed = nowIso();
  }
  if (nextStage) {
    await run(c.env.DB,
      `UPDATE commissions SET stage = ?, completed_at = COALESCE(?, completed_at), updated_at = ? WHERE id = ?`,
      nextStage, completed, nowIso(), id,
    );
  }

  // Issue certificate on final release
  if (stage === 'final') {
    const cm = await first<{ scope: string }>(c.env.DB, `SELECT scope FROM commissions WHERE id = ?`, id);
    const serial = `AS-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;
    const title = (cm?.scope ?? '').split(/\n/)[0].slice(0, 80) || 'Untitled';
    await run(c.env.DB,
      `UPDATE commissions SET certificate_issued_at = ?, certificate_serial = ?, certificate_title = ? WHERE id = ?`,
      nowIso(), serial, title, id,
    );
  }

  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, stage === 'final'
      ? `Released the final payment. Commission delivered.`
      : `Released the ${stage} milestone to the artist.`,
  );

  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/midpoint — artist marks midpoint.
const NoteBody = z.object({ body: z.string().min(1) });
app.post('/:id/midpoint', async (c) => {
  const id = c.req.param('id');
  const parsed = NoteBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  await run(c.env.DB, `UPDATE commissions SET stage = 'midpoint-review', updated_at = ? WHERE id = ?`, nowIso(), id);
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', 'Artist', ?)`,
    newId('msg'), id, parsed.data.body,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, 'Artist marked the midpoint. Review and release the midpoint payment when ready.',
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/final — artist marks final.
app.post('/:id/final', async (c) => {
  const id = c.req.param('id');
  const parsed = NoteBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  await run(c.env.DB, `UPDATE commissions SET stage = 'final-review', updated_at = ? WHERE id = ?`, nowIso(), id);
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', 'Artist', ?)`,
    newId('msg'), id, parsed.data.body,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, 'Artist marked the work complete. Inspect and release the final payment.',
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/messages — append a message.
const MsgBody = z.object({
  author_role: z.enum(['patron', 'artist']),
  author_name: z.string(),
  body: z.string().min(1),
});
app.post('/:id/messages', async (c) => {
  const id = c.req.param('id');
  const parsed = MsgBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, ?, ?, ?)`,
    newId('msg'), id, parsed.data.author_role, parsed.data.author_name, parsed.data.body,
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/wip — artist posts a WIP update.
const WipBody = z.object({
  caption: z.string().min(1),
  palette_from: z.string().optional(),
  palette_to: z.string().optional(),
  pattern: z.string().optional(),
  image_url: z.string().optional(),
});
app.post('/:id/wip', async (c) => {
  const id = c.req.param('id');
  const parsed = WipBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  await run(c.env.DB,
    `INSERT INTO commission_wip (id, commission_id, caption, image_url, palette_from, palette_to, pattern) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId('wip'), id, parsed.data.caption, parsed.data.image_url ?? null,
    parsed.data.palette_from ?? null, parsed.data.palette_to ?? null, parsed.data.pattern ?? null,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', 'Artist', ?)`,
    newId('msg'), id, `New studio update: ${parsed.data.caption}`,
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/blessing
const BlessingBody = z.object({
  recorded_by: z.string().min(1),
  parish_or_chapel: z.string().optional(),
  note: z.string().optional(),
});
app.post('/:id/blessing', async (c) => {
  const id = c.req.param('id');
  const parsed = BlessingBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  await run(c.env.DB,
    `UPDATE commissions SET stage = 'blessed', blessing_recorded_at = ?, blessing_recorded_by = ?, blessing_parish_or_chapel = ?, blessing_note = ? WHERE id = ?`,
    nowIso(), parsed.data.recorded_by, parsed.data.parish_or_chapel ?? null, parsed.data.note ?? null, id,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, `Blessing recorded by ${parsed.data.recorded_by}${parsed.data.parish_or_chapel ? ` at ${parsed.data.parish_or_chapel}` : ''}.`,
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/cancel
app.post('/:id/cancel', async (c) => {
  const id = c.req.param('id');
  await run(c.env.DB,
    `UPDATE commissions SET stage = 'cancelled', cancelled_at = ? WHERE id = ?`,
    nowIso(), id,
  );
  await run(c.env.DB,
    `UPDATE commission_escrow SET status = 'refunded' WHERE commission_id = ? AND status = 'held'`,
    id,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, 'Commission cancelled. Held funds were refunded to the patron.',
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/review
const ReviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1),
});
app.post('/:id/review', async (c) => {
  const id = c.req.param('id');
  const parsed = ReviewBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);

  const cm = await first<{ artist_id: string; patron_name: string; stage: string }>(
    c.env.DB, `SELECT artist_id, patron_name, stage FROM commissions WHERE id = ?`, id,
  );
  if (!cm) return c.json({ ok: false }, 404);
  if (cm.stage !== 'delivered' && cm.stage !== 'blessed') {
    return c.json({ ok: false, error: 'commission not delivered yet' }, 400);
  }
  const existing = await first(c.env.DB, `SELECT id FROM reviews WHERE commission_id = ?`, id);
  if (existing) return c.json({ ok: false, error: 'already reviewed' }, 400);

  await run(c.env.DB,
    `INSERT INTO reviews (id, commission_id, artist_id, patron_name, rating, body) VALUES (?, ?, ?, ?, ?, ?)`,
    newId('rev'), id, cm.artist_id, cm.patron_name, parsed.data.rating, parsed.data.body,
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// ── helpers ──────────────────────────────────────────────────────────
async function loadCommission(db: D1Database, id: string) {
  const cm = await first<any>(db, `SELECT * FROM commissions WHERE id = ?`, id);
  if (!cm) return null;
  const escrow = await all(db, `SELECT * FROM commission_escrow WHERE commission_id = ? ORDER BY
    CASE stage WHEN 'deposit' THEN 1 WHEN 'midpoint' THEN 2 WHEN 'final' THEN 3 END`, id);
  const messages = await all(db, `SELECT * FROM commission_messages WHERE commission_id = ? ORDER BY created_at`, id);
  const wip = await all(db, `SELECT * FROM commission_wip WHERE commission_id = ? ORDER BY posted_at`, id);
  return { ...cm, escrow, messages, wip };
}

export default app;
