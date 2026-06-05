// Commission lifecycle: create, quote, fund, release, mark midpoint /
// final, post WIP, message, record blessing, cancel, dispute, review.
//
// SECURITY MODEL
// Every state-changing endpoint requires an authenticated session.
// Role checks: `loadParticipantRole` returns 'patron' | 'artist' |
// 'operator' | null. patron-only actions (fund, release, blessing,
// cancel-by-patron, review) reject for any other role; artist-only
// actions (quote, midpoint, final, wip) reject for any other role.
// 'operator' can do anything (admin override). Stage transitions are
// guarded inside the UPDATE itself (`WHERE stage = ?`) so concurrent
// requests can't both win.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { all, first, newId, nowIso, run } from '../lib/db';
import { requireAuth } from '../lib/auth';
import { computePricing, PLATFORM_FEE_PCT } from '../lib/pricing';
import { sendEmail } from '../lib/email';
import { quoteSentToPatron } from '../lib/email-templates';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

type ParticipantRole = 'patron' | 'artist' | 'operator';

async function loadParticipantRole(
  env: Env,
  commissionId: string,
  user: { id: string; email: string; role: string },
): Promise<{ role: ParticipantRole | null; commission: { id: string; stage: string; artist_id: string; patron_id: string | null; patron_email: string } | null }> {
  const cm = await first<{ id: string; stage: string; artist_id: string; patron_id: string | null; patron_email: string }>(
    env.DB,
    `SELECT id, stage, artist_id, patron_id, patron_email FROM commissions WHERE id = ?`,
    commissionId,
  );
  if (!cm) return { role: null, commission: null };
  if (user.role === 'operator') return { role: 'operator', commission: cm };
  if (cm.patron_id === user.id || cm.patron_email.toLowerCase() === user.email.toLowerCase()) {
    return { role: 'patron', commission: cm };
  }
  const artist = await first<{ user_id: string | null }>(env.DB, `SELECT user_id FROM artists WHERE id = ?`, cm.artist_id);
  if (artist?.user_id && artist.user_id === user.id) return { role: 'artist', commission: cm };
  return { role: null, commission: cm };
}

const CreateBody = z.object({
  artist_slug: z.string(),
  patron_name: z.string().min(1),
  setting: z.string().optional(),
  scope: z.string().min(1).max(10_000),
  category_slug: z.string().optional(),
  preferred_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  feast_slug: z.string().optional(),
  feast_name: z.string().optional(),
  feast_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  parish_or_chapel: z.string().optional(),
  diocese: z.string().optional(),
  ip_terms: z.enum(['patron-exclusive', 'shared-prints', 'artist-retains', 'shared-custom']).default('patron-exclusive'),
});

// POST /api/commissions  — authenticated patron creates a new commission request.
// patron_email is always derived from the session; never accepted from the body.
app.post('/', requireAuth(), async (c) => {
  const u = c.var.user!;
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
    u.id,
    parsed.data.patron_name,
    u.email,
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
       WHERE c.patron_id = ? OR c.patron_email = ? OR a.user_id = ?
       ORDER BY c.created_at DESC LIMIT 200`;
  const rows = u.role === 'operator'
    ? await all(c.env.DB, sql)
    : await all(c.env.DB, sql, u.id, u.email.toLowerCase(), u.id);
  return c.json({ commissions: rows });
});

// GET /api/commissions/letters — public anonymized letter archive.
// Only commissions where the patron opted in (letter_public = 1) and
// the work has been completed (delivered or blessed).
app.get('/letters', async (c) => {
  const rows = await all<{
    id: string;
    artist_slug: string;
    artist_name: string;
    patron_name: string;
    category_slug: string | null;
    feast_name: string | null;
    completed_at: string | null;
    letter_body: string;
    vision_body: string | null;
  }>(c.env.DB,
    `SELECT c.id, a.slug AS artist_slug, a.name AS artist_name,
            c.patron_name, c.category_slug, c.feast_name, c.completed_at,
            (SELECT body FROM commission_messages
               WHERE commission_id = c.id AND author_role = 'patron'
               ORDER BY created_at ASC LIMIT 1) AS letter_body,
            (SELECT body FROM commission_messages
               WHERE commission_id = c.id AND author_role = 'artist'
               ORDER BY created_at ASC LIMIT 1) AS vision_body
       FROM commissions c
       JOIN artists a ON a.id = c.artist_id
       WHERE c.letter_public = 1
         AND c.stage IN ('delivered', 'blessed')
       ORDER BY c.completed_at DESC
       LIMIT 50`);
  const anon = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0] + '.';
    return `${parts[0][0]}. ${parts[parts.length - 1][0]}.`;
  };
  return c.json({
    letters: rows
      .filter((r) => r.letter_body)
      .map((r) => ({
        from: anon(r.patron_name),
        to: r.artist_name,
        artist_slug: r.artist_slug,
        category: r.category_slug,
        for_feast: r.feast_name,
        completed_at: r.completed_at,
        letter: r.letter_body,
        vision: r.vision_body,
      })),
  });
});

// POST /api/commissions/:id/share — patron mints a 30-day signed share
// token that lets recipients view the workspace read-only at
// /share/:token. Token is the column's UUID-based value; revoke by
// posting DELETE.
app.post('/:id/share', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'patron' && role !== 'operator') {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const token =
    crypto.randomUUID().replace(/-/g, '') +
    crypto.randomUUID().replace(/-/g, '');
  await run(c.env.DB,
    `UPDATE commissions SET share_token = ? WHERE id = ?`,
    token, id);
  return c.json({ ok: true, token, url: `${c.env.SITE_URL}/share/${token}` });
});

app.delete('/:id/share', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'patron' && role !== 'operator') {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  await run(c.env.DB,
    `UPDATE commissions SET share_token = NULL WHERE id = ?`, id);
  return c.json({ ok: true });
});

// PUT /api/commissions/:id/letter-public — patron toggles whether
// their commission's letter (and vision response) appear in the
// public Letter Archive. Anonymized in any case.
const LetterPublicBody = z.object({ public: z.boolean() });
app.put('/:id/letter-public', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = LetterPublicBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'patron' && role !== 'operator') {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  await run(c.env.DB,
    `UPDATE commissions SET letter_public = ? WHERE id = ?`,
    parsed.data.public ? 1 : 0, id);
  return c.json({ ok: true });
});

// GET /api/commissions/share/:token — public, read-only view.
app.get('/share/:token', async (c) => {
  const token = c.req.param('token');
  if (!token || token.length < 32) return c.json({ ok: false }, 404);
  const cm = await first<any>(c.env.DB,
    `SELECT id FROM commissions WHERE share_token = ?`, token);
  if (!cm) return c.json({ ok: false }, 404);
  const full = await loadCommission(c.env.DB, cm.id);
  if (!full) return c.json({ ok: false }, 404);
  return c.json({ commission: full });
});

// GET /api/commissions/:id — participant or operator only.
app.get('/:id', requireAuth(), async (c) => {
  const u = c.var.user!;
  const { role, commission } = await loadParticipantRole(c.env, c.req.param('id'), u);
  if (!commission) return c.json({ ok: false, error: 'not found' }, 404);
  if (!role) return c.json({ ok: false, error: 'forbidden' }, 403);
  const full = await loadCommission(c.env.DB, commission.id);
  return c.json({ commission: full });
});

// POST /api/commissions/:id/quote — artist (or operator) sends a quote.
// `vision` arrives first — what the artist saw when they read the
// patron's letter. `note` is optional and pricing-specific.
const QuoteBody = z.object({
  artist_total_usd: z.number().int().min(100).max(1_000_000),
  vision: z.string().min(80).max(10_000),
  note: z.string().max(10_000).default(''),
});
app.post('/:id/quote', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = QuoteBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: parsed.error.flatten() }, 400);

  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'artist' && role !== 'operator') return c.json({ ok: false, error: 'forbidden' }, 403);

  const p = computePricing(parsed.data.artist_total_usd);

  // Atomic stage guard: only transitions from 'scoping' succeed.
  const advance = await c.env.DB.prepare(
    `UPDATE commissions SET
       stage = 'awaiting-deposit',
       artist_quote_note = ?,
       artist_total_usd = ?,
       platform_fee_usd = ?,
       total_due_usd = ?,
       updated_at = ?
     WHERE id = ? AND stage = 'scoping'`,
  ).bind(parsed.data.note, p.artistTotalUsd, p.platformFeeUsd, p.totalDueUsd, nowIso(), id).run();
  if ((advance.meta?.changes ?? 0) !== 1) {
    return c.json({ ok: false, error: 'wrong stage' }, 409);
  }

  for (const m of p.escrow) {
    await run(
      c.env.DB,
      `INSERT INTO commission_escrow (id, commission_id, stage, label, pct, amount_usd, status)
       VALUES (?, ?, ?, ?, ?, ?, 'unfunded')`,
      newId('esc'), id, m.stage, m.label, m.pct, m.amountUsd,
    );
  }

  // The vision arrives first — the artist's answer to the patron's
  // letter, before any number.
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', ?, ?)`,
    newId('msg'), id, u.email.split('@')[0], parsed.data.vision,
  );
  // Then the practicalities, if the artist sent any.
  if (parsed.data.note.trim()) {
    await run(c.env.DB,
      `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', ?, ?)`,
      newId('msg'), id, u.email.split('@')[0], parsed.data.note,
    );
  }
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, `Quote: $${p.artistTotalUsd.toLocaleString()} to the artist, paid across three milestones. A ${Math.round(p.platformFeePct * 100)}% guild tithe is settled at the end.`,
  );

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

  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/escrow/:stage/fund — patron (or operator) funds a milestone.
app.post('/:id/escrow/:stage/fund', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const stage = c.req.param('stage');
  if (!['deposit', 'midpoint', 'final'].includes(stage)) {
    return c.json({ ok: false, error: 'bad stage' }, 400);
  }
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'patron' && role !== 'operator') return c.json({ ok: false, error: 'forbidden' }, 403);

  // Atomic fund: only one concurrent caller wins.
  const claim = await c.env.DB
    .prepare(
      `UPDATE commission_escrow SET status = 'held', funded_at = ?
         WHERE commission_id = ? AND stage = ? AND status = 'unfunded'`,
    )
    .bind(nowIso(), id, stage)
    .run();
  if ((claim.meta?.changes ?? 0) !== 1) {
    return c.json({ ok: false, error: 'milestone not unfunded' }, 409);
  }

  if (stage === 'deposit') {
    await run(c.env.DB,
      `UPDATE commissions SET stage = 'in-progress', updated_at = ?
         WHERE id = ? AND stage = 'awaiting-deposit'`,
      nowIso(), id,
    );
  }

  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, `Funded the ${stage} milestone. Funds are held in escrow.`,
  );

  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/escrow/:stage/release — patron (or operator) releases.
// Release requires the milestone to be currently held — no auto-fund.
app.post('/:id/escrow/:stage/release', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const stage = c.req.param('stage');
  if (!['deposit', 'midpoint', 'final'].includes(stage)) {
    return c.json({ ok: false, error: 'bad stage' }, 400);
  }
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'patron' && role !== 'operator') return c.json({ ok: false, error: 'forbidden' }, 403);

  const claim = await c.env.DB
    .prepare(
      `UPDATE commission_escrow SET status = 'released', released_at = ?
         WHERE commission_id = ? AND stage = ? AND status = 'held'`,
    )
    .bind(nowIso(), id, stage)
    .run();
  if ((claim.meta?.changes ?? 0) !== 1) {
    return c.json({ ok: false, error: 'milestone not held' }, 409);
  }

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

  if (stage === 'final') {
    const cmRow = await first<{ scope: string }>(c.env.DB, `SELECT scope FROM commissions WHERE id = ?`, id);
    const serial = `AS-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;
    const title = (cmRow?.scope ?? '').split(/\n/)[0].slice(0, 80) || 'Untitled';
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

const NoteBody = z.object({ body: z.string().min(1).max(10_000) });

// POST /api/commissions/:id/midpoint — artist marks midpoint.
app.post('/:id/midpoint', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = NoteBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'artist' && role !== 'operator') return c.json({ ok: false, error: 'forbidden' }, 403);

  const advance = await c.env.DB
    .prepare(
      `UPDATE commissions SET stage = 'midpoint-review', updated_at = ?
         WHERE id = ? AND stage = 'in-progress'`,
    )
    .bind(nowIso(), id)
    .run();
  if ((advance.meta?.changes ?? 0) !== 1) {
    return c.json({ ok: false, error: 'wrong stage' }, 409);
  }

  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', ?, ?)`,
    newId('msg'), id, u.email.split('@')[0], parsed.data.body,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, 'Artist marked the midpoint. Review and release the midpoint payment when ready.',
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/final — artist marks final.
app.post('/:id/final', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = NoteBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'artist' && role !== 'operator') return c.json({ ok: false, error: 'forbidden' }, 403);

  const advance = await c.env.DB
    .prepare(
      `UPDATE commissions SET stage = 'final-review', updated_at = ?
         WHERE id = ? AND stage IN ('in-progress','midpoint-review')`,
    )
    .bind(nowIso(), id)
    .run();
  if ((advance.meta?.changes ?? 0) !== 1) {
    return c.json({ ok: false, error: 'wrong stage' }, 409);
  }

  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', ?, ?)`,
    newId('msg'), id, u.email.split('@')[0], parsed.data.body,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, 'Artist marked the work complete. Inspect and release the final payment.',
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/messages — author derived from session, never trusted from body.
const MsgBody = z.object({
  body: z.string().min(1).max(10_000),
});
app.post('/:id/messages', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = MsgBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role === null) return c.json({ ok: false, error: 'forbidden' }, 403);

  const authorRole = role === 'operator' ? 'system' : role;
  const authorName = role === 'operator' ? 'Ars Sacra' : u.email.split('@')[0];

  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, ?, ?, ?)`,
    newId('msg'), id, authorRole, authorName, parsed.data.body,
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/wip — artist posts a WIP update.
const WipBody = z.object({
  caption: z.string().min(1).max(2000),
  palette_from: z.string().max(16).optional(),
  palette_to: z.string().max(16).optional(),
  pattern: z.string().max(64).optional(),
  image_url: z.string().max(2000).optional(),
});
app.post('/:id/wip', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = WipBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'artist' && role !== 'operator') return c.json({ ok: false, error: 'forbidden' }, 403);

  await run(c.env.DB,
    `INSERT INTO commission_wip (id, commission_id, caption, image_url, palette_from, palette_to, pattern) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId('wip'), id, parsed.data.caption, parsed.data.image_url ?? null,
    parsed.data.palette_from ?? null, parsed.data.palette_to ?? null, parsed.data.pattern ?? null,
  );
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'artist', ?, ?)`,
    newId('msg'), id, u.email.split('@')[0], `New studio update: ${parsed.data.caption}`,
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/blessing — patron (or operator) records the blessing.
const BlessingBody = z.object({
  recorded_by: z.string().min(1).max(200),
  parish_or_chapel: z.string().max(200).optional(),
  note: z.string().max(2000).optional(),
});
app.post('/:id/blessing', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = BlessingBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role !== 'patron' && role !== 'operator') return c.json({ ok: false, error: 'forbidden' }, 403);

  const advance = await c.env.DB
    .prepare(
      `UPDATE commissions SET stage = 'blessed',
         blessing_recorded_at = ?,
         blessing_recorded_by = ?,
         blessing_parish_or_chapel = ?,
         blessing_note = ?
         WHERE id = ? AND stage = 'delivered'`,
    )
    .bind(nowIso(), parsed.data.recorded_by, parsed.data.parish_or_chapel ?? null, parsed.data.note ?? null, id)
    .run();
  if ((advance.meta?.changes ?? 0) !== 1) {
    return c.json({ ok: false, error: 'commission not yet delivered' }, 409);
  }

  // Sanitize for the system message body
  const recBy = parsed.data.recorded_by.replace(/[\r\n]/g, ' ');
  const parish = parsed.data.parish_or_chapel?.replace(/[\r\n]/g, ' ');
  await run(c.env.DB,
    `INSERT INTO commission_messages (id, commission_id, author_role, author_name, body) VALUES (?, ?, 'system', 'Ars Sacra', ?)`,
    newId('msg'), id, `Blessing recorded by ${recBy}${parish ? ` at ${parish}` : ''}.`,
  );
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// POST /api/commissions/:id/cancel — patron, artist, or operator can cancel
// while still in flight. Cannot cancel a delivered/blessed/already-cancelled
// commission. Idempotent via stage guard.
app.post('/:id/cancel', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false, error: 'not found' }, 404);
  if (role === null) return c.json({ ok: false, error: 'forbidden' }, 403);

  const advance = await c.env.DB
    .prepare(
      `UPDATE commissions SET stage = 'cancelled', cancelled_at = ?
         WHERE id = ?
           AND stage IN ('scoping','awaiting-deposit','in-progress','midpoint-review','final-review')`,
    )
    .bind(nowIso(), id)
    .run();
  if ((advance.meta?.changes ?? 0) !== 1) {
    return c.json({ ok: false, error: 'cannot cancel from this stage' }, 409);
  }

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

// POST /api/commissions/:id/review — patron only.
const ReviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(10_000),
});
app.post('/:id/review', requireAuth(), async (c) => {
  const u = c.var.user!;
  const id = c.req.param('id');
  const parsed = ReviewBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);

  const { role, commission: cm } = await loadParticipantRole(c.env, id, u);
  if (!cm) return c.json({ ok: false }, 404);
  if (role !== 'patron' && role !== 'operator') return c.json({ ok: false, error: 'forbidden' }, 403);
  if (cm.stage !== 'delivered' && cm.stage !== 'blessed') {
    return c.json({ ok: false, error: 'commission not delivered yet' }, 400);
  }
  // Full row needed for patron_name (we only loaded the participant-cm columns).
  const cmFull = await first<{ patron_name: string }>(c.env.DB, `SELECT patron_name FROM commissions WHERE id = ?`, id);
  if (!cmFull) return c.json({ ok: false }, 404);

  // UNIQUE constraint on reviews.commission_id makes the insert itself
  // race-safe; we don't pre-check.
  try {
    await run(c.env.DB,
      `INSERT INTO reviews (id, commission_id, artist_id, patron_name, rating, body) VALUES (?, ?, ?, ?, ?, ?)`,
      newId('rev'), id, cm.artist_id, cmFull.patron_name, parsed.data.rating, parsed.data.body,
    );
  } catch (e) {
    // Likely a UNIQUE violation — already reviewed.
    return c.json({ ok: false, error: 'already reviewed' }, 409);
  }
  return c.json({ commission: await loadCommission(c.env.DB, id) });
});

// ── helpers ──────────────────────────────────────────────────────────
// loadCommission uses db.batch to parallelize the 4 follow-up queries
// (commission, escrow, messages, wip) instead of running them serially.
async function loadCommission(db: D1Database, id: string) {
  const [cmRes, escrowRes, msgsRes, wipRes] = await db.batch([
    db.prepare(`SELECT * FROM commissions WHERE id = ?`).bind(id),
    db.prepare(`SELECT * FROM commission_escrow WHERE commission_id = ? ORDER BY
      CASE stage WHEN 'deposit' THEN 1 WHEN 'midpoint' THEN 2 WHEN 'final' THEN 3 END`).bind(id),
    db.prepare(`SELECT * FROM commission_messages WHERE commission_id = ? ORDER BY created_at`).bind(id),
    db.prepare(`SELECT * FROM commission_wip WHERE commission_id = ? ORDER BY posted_at`).bind(id),
  ]);
  const cm = (cmRes.results?.[0] as any) ?? null;
  if (!cm) return null;
  return {
    ...cm,
    escrow: escrowRes.results ?? [],
    messages: msgsRes.results ?? [],
    wip: wipRes.results ?? [],
  };
}

export default app;
