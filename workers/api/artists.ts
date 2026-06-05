// Artist directory: list, get by slug, full-text search, filter,
// recommend similar. Backed by D1 + FTS5.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { all, first, newId, nowIso, run } from '../lib/db';
import { requireAuth, requireRole } from '../lib/auth';
import { synthesizeVocation, type QuestionnaireResponses } from '../lib/synthesize';
import { sendEmail } from '../lib/email';
import { pastorEndorsementRequest } from '../lib/email-templates';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

interface ArtistRow {
  id: string;
  slug: string;
  honorific: string | null;
  name: string;
  city: string;
  region: string;
  bio: string;            // JSON array
  portrait_from: string | null;
  portrait_to: string | null;
  accepting_commissions: number;
  years_practicing: number;
  starting_at: number;
  custom_pricing: number;
  diocese_name: string | null;
  order_slug: string | null;
  vocation_statement: string | null;
  patron: string | null;
  // Vocation-site fields (questionnaire-derived, artist-editable)
  mission_statement?: string | null;
  studio_rhythm?: string | null;
  process_note?: string | null;
  instagram_handle?: string | null;
  x_handle?: string | null;
  personal_url?: string | null;
  profile_published?: number;
  sabbatical_until?: string | null;
  trained_under?: string | null;
  trained_under_slug?: string | null;
  working_toward_feasts?: string | null; // JSON array string
}

// GET /api/artists?q=…&category=…&saint=…&diocese=…&order=…&accepting=true&min=&max=&saved=&sort=
app.get('/', async (c) => {
  const q = c.req.query('q')?.trim();
  const category = c.req.query('category');
  const saint = c.req.query('saint');
  const diocese = c.req.query('diocese');
  const order = c.req.query('order');
  const accepting = c.req.query('accepting') === 'true';
  const min = c.req.query('min') ? Number(c.req.query('min')) : null;
  const max = c.req.query('max') ? Number(c.req.query('max')) : null;
  const sort = c.req.query('sort') ?? 'relevance';

  const where: string[] = [];
  const binds: unknown[] = [];
  let join = '';

  if (q) {
    // FTS5 has its own query language (column:value, AND/OR, NEAR(),
    // quoted phrases). Untrusted input there 500s the request or lets
    // an attacker search hidden columns. Strip operators and wrap
    // each token as a quoted phrase.
    const safe = q
      .replace(/["'()*:^]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 8)
      .map((t) => `"${t.replace(/"/g, '""')}"`)
      .join(' ');
    if (safe) {
      join += ' JOIN artists_fts ON artists.rowid = artists_fts.rowid';
      where.push(`artists_fts MATCH ?`);
      binds.push(safe);
    }
  }
  if (category) {
    join += ` JOIN artist_categories ac ON ac.artist_id = artists.id AND ac.category_slug = ?`;
    binds.push(category);
  }
  if (saint) {
    join += ` JOIN artist_saints ON artist_saints.artist_id = artists.id AND artist_saints.saint_slug = ?`;
    binds.push(saint);
  }
  if (diocese) {
    where.push(`artists.diocese_name = ?`);
    binds.push(diocese);
  }
  if (order) {
    where.push(`artists.order_slug = ?`);
    binds.push(order);
  }
  if (accepting) {
    where.push(`artists.accepting_commissions = 1`);
  }
  if (min != null) {
    where.push(`artists.starting_at >= ?`);
    binds.push(min);
  }
  if (max != null) {
    where.push(`artists.starting_at <= ?`);
    binds.push(max);
  }

  let orderBy: string;
  switch (sort) {
    case 'price-asc':  orderBy = 'artists.starting_at ASC'; break;
    case 'price-desc': orderBy = 'artists.starting_at DESC'; break;
    case 'newest':     orderBy = 'artists.created_at DESC'; break;
    case 'popular':
      // Most-commissioned: count of completed commissions per artist
      orderBy = `(SELECT COUNT(*) FROM commissions WHERE commissions.artist_id = artists.id) DESC`;
      break;
    default: orderBy = q ? 'rank' : 'artists.created_at DESC';
  }

  const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const sql = `SELECT DISTINCT artists.* FROM artists ${join}${whereClause} ORDER BY ${orderBy} LIMIT 60`;
  const rows = await all<ArtistRow>(c.env.DB, sql, ...binds);

  return c.json({
    artists: rows.map(serialize),
  });
});

// GET /api/artists/:slug
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const a = await first<ArtistRow>(
    c.env.DB,
    `SELECT * FROM artists WHERE slug = ?`,
    slug,
  );
  if (!a) return c.json({ ok: false, error: 'not found' }, 404);

  const categories = await all<{ category_slug: string }>(
    c.env.DB,
    `SELECT category_slug FROM artist_categories WHERE artist_id = ?`,
    a.id,
  );
  const saints = await all<{ saint_slug: string }>(
    c.env.DB,
    `SELECT saint_slug FROM artist_saints WHERE artist_id = ?`,
    a.id,
  );
  const tiers = await all(
    c.env.DB,
    `SELECT * FROM artist_tiers WHERE artist_id = ? ORDER BY sort_order ASC`,
    a.id,
  );
  const works = await all(
    c.env.DB,
    `SELECT * FROM artworks WHERE artist_id = ? ORDER BY sort_order ASC`,
    a.id,
  );

  // Track-record metrics
  const stats = await first<{
    delivered: number;
    on_time: number;
    avg_weeks: number | null;
    avg_rating: number | null;
  }>(
    c.env.DB,
    `SELECT
       COUNT(*) FILTER (WHERE stage IN ('delivered','blessed')) AS delivered,
       COUNT(*) FILTER (WHERE stage IN ('delivered','blessed') AND (preferred_deadline IS NULL OR completed_at <= preferred_deadline)) AS on_time,
       NULL AS avg_weeks,
       (SELECT AVG(rating) FROM reviews WHERE artist_id = ?) AS avg_rating
     FROM commissions WHERE artist_id = ?`,
    a.id,
    a.id,
  );

  const reviews = await all(
    c.env.DB,
    `SELECT * FROM reviews WHERE artist_id = ? ORDER BY created_at DESC LIMIT 20`,
    a.id,
  );

  return c.json({
    artist: serialize(a),
    categories: categories.map((c) => c.category_slug),
    saints: saints.map((s) => s.saint_slug),
    tiers,
    works,
    stats,
    reviews,
  });
});

// GET /api/artists/:slug/similar — recommendations by shared categories + saints
app.get('/:slug/similar', async (c) => {
  const slug = c.req.param('slug');
  const a = await first<{ id: string; starting_at: number }>(
    c.env.DB,
    `SELECT id, starting_at FROM artists WHERE slug = ?`,
    slug,
  );
  if (!a) return c.json({ artists: [] });

  const sql = `
    SELECT artists.*,
      (
        (SELECT COUNT(*) FROM artist_categories ac1 JOIN artist_categories ac2
          ON ac1.category_slug = ac2.category_slug
          WHERE ac1.artist_id = ? AND ac2.artist_id = artists.id) * 3
      + (SELECT COUNT(*) FROM artist_saints s1 JOIN artist_saints s2
          ON s1.saint_slug = s2.saint_slug
          WHERE s1.artist_id = ? AND s2.artist_id = artists.id) * 2
      + (CASE WHEN ABS(artists.starting_at - ?) < 1500 THEN 1 ELSE 0 END)
      ) AS score
    FROM artists
    WHERE artists.id != ?
    ORDER BY score DESC, artists.created_at DESC
    LIMIT 4`;
  const rows = await all<ArtistRow & { score: number }>(c.env.DB, sql, a.id, a.id, a.starting_at, a.id);
  return c.json({ artists: rows.filter((r) => r.score > 0).map(serialize) });
});

// POST /api/artists/:slug/claim — operator-only. Pre-registers the
// email an artist will sign in with. When they sign in via magic-link,
// `consumeMagicLink` finds the matching artists.user_email and links
// the user_id automatically, then promotes the user to 'artist' role.
const ClaimBody = z.object({ email: z.string().email() });
app.post('/:slug/claim', requireRole('operator'), async (c) => {
  const slug = c.req.param('slug');
  const parsed = ClaimBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: 'invalid email' }, 400);

  const artist = await first<{ id: string; user_id: string | null }>(
    c.env.DB,
    `SELECT id, user_id FROM artists WHERE slug = ?`,
    slug,
  );
  if (!artist) return c.json({ ok: false, error: 'artist not found' }, 404);

  const email = parsed.data.email.toLowerCase();

  // If a user with this email is already signed up, link immediately
  // and skip the wait-for-sign-in dance.
  const existingUser = await first<{ id: string; role: string }>(
    c.env.DB,
    `SELECT id, role FROM users WHERE email = ?`,
    email,
  );

  await run(c.env.DB,
    `UPDATE artists SET user_email = ?, user_id = COALESCE(?, user_id) WHERE id = ?`,
    email, existingUser?.id ?? null, artist.id,
  );

  if (existingUser && existingUser.role !== 'operator') {
    await run(c.env.DB,
      `UPDATE users SET role = 'artist' WHERE id = ? AND role != 'operator'`,
      existingUser.id,
    );
  }

  return c.json({
    ok: true,
    linked_now: Boolean(existingUser),
    artist_id: artist.id,
  });
});

// ── Vocation site (questionnaire + AI synthesis + edits) ────────────
// Only the artist themselves, or an operator, can touch these.

async function assertArtistOwnership(
  env: Env,
  slug: string,
  user: { id: string; role: string },
): Promise<{ id: string; user_id: string | null } | null> {
  const a = await first<{ id: string; user_id: string | null }>(
    env.DB, `SELECT id, user_id FROM artists WHERE slug = ?`, slug,
  );
  if (!a) return null;
  if (user.role === 'operator') return a;
  if (a.user_id === user.id) return a;
  return null;
}

// GET /api/artists/:slug/questionnaire — artist (or operator) reads
// their saved responses to render the editor.
app.get('/:slug/questionnaire', requireAuth(), async (c) => {
  const slug = c.req.param('slug');
  const ownership = await assertArtistOwnership(c.env, slug, c.var.user!);
  if (!ownership) return c.json({ ok: false, error: 'forbidden' }, 403);
  const row = await first(c.env.DB,
    `SELECT * FROM artist_questionnaire WHERE artist_id = ?`, ownership.id);
  return c.json({ responses: row ?? null });
});

// PUT /api/artists/:slug/questionnaire — save (or update) responses.
const QBody = z.object({
  q1_first_call:    z.string().max(4000).optional(),
  q2_lineage:       z.string().max(4000).optional(),
  q3_canon:         z.string().max(4000).optional(),
  q4_patron_saints: z.string().max(4000).optional(),
  q5_rhythm:        z.string().max(4000).optional(),
  q6_materials:     z.string().max(4000).optional(),
  q7_for_parish:    z.string().max(4000).optional(),
  q8_for_home:      z.string().max(4000).optional(),
  q9_the_cost:      z.string().max(4000).optional(),
  q10_the_prayer:   z.string().max(4000).optional(),
});
app.put('/:slug/questionnaire', requireAuth(), async (c) => {
  const slug = c.req.param('slug');
  const ownership = await assertArtistOwnership(c.env, slug, c.var.user!);
  if (!ownership) return c.json({ ok: false, error: 'forbidden' }, 403);
  const parsed = QBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const d = parsed.data;
  await run(c.env.DB,
    `INSERT INTO artist_questionnaire (
       artist_id, q1_first_call, q2_lineage, q3_canon, q4_patron_saints,
       q5_rhythm, q6_materials, q7_for_parish, q8_for_home, q9_the_cost,
       q10_the_prayer, submitted_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(artist_id) DO UPDATE SET
       q1_first_call    = excluded.q1_first_call,
       q2_lineage       = excluded.q2_lineage,
       q3_canon         = excluded.q3_canon,
       q4_patron_saints = excluded.q4_patron_saints,
       q5_rhythm        = excluded.q5_rhythm,
       q6_materials     = excluded.q6_materials,
       q7_for_parish    = excluded.q7_for_parish,
       q8_for_home      = excluded.q8_for_home,
       q9_the_cost      = excluded.q9_the_cost,
       q10_the_prayer   = excluded.q10_the_prayer,
       submitted_at     = COALESCE(artist_questionnaire.submitted_at, excluded.submitted_at),
       updated_at       = excluded.updated_at`,
    ownership.id,
    d.q1_first_call ?? null, d.q2_lineage ?? null, d.q3_canon ?? null,
    d.q4_patron_saints ?? null, d.q5_rhythm ?? null, d.q6_materials ?? null,
    d.q7_for_parish ?? null, d.q8_for_home ?? null, d.q9_the_cost ?? null,
    d.q10_the_prayer ?? null,
    nowIso(), nowIso(),
  );
  return c.json({ ok: true });
});

// POST /api/artists/:slug/synthesize — runs Workers AI on the saved
// responses, stores the three generated fields as DRAFTS on artists.
// The artist edits them via PUT /:slug/profile.
app.post('/:slug/synthesize', requireAuth(), async (c) => {
  const slug = c.req.param('slug');
  const ownership = await assertArtistOwnership(c.env, slug, c.var.user!);
  if (!ownership) return c.json({ ok: false, error: 'forbidden' }, 403);
  const r = await first<QuestionnaireResponses>(c.env.DB,
    `SELECT q1_first_call, q2_lineage, q3_canon, q4_patron_saints,
            q5_rhythm, q6_materials, q7_for_parish, q8_for_home,
            q9_the_cost, q10_the_prayer
       FROM artist_questionnaire WHERE artist_id = ?`,
    ownership.id);
  if (!r) return c.json({ ok: false, error: 'no responses yet' }, 400);
  try {
    const synth = await synthesizeVocation(c.env, r);
    await run(c.env.DB,
      `UPDATE artists SET
         mission_statement = ?,
         studio_rhythm = ?,
         process_note = ?,
         updated_at = ?
         WHERE id = ?`,
      synth.mission_statement, synth.studio_rhythm, synth.process_note,
      nowIso(), ownership.id);
    await run(c.env.DB,
      `UPDATE artist_questionnaire SET ai_generated_at = ? WHERE artist_id = ?`,
      nowIso(), ownership.id);
    return c.json({ ok: true, synthesis: synth });
  } catch (e) {
    const msg = (e as Error).message ?? 'synthesis failed';
    // 503 when the synthesizer isn't configured yet, so the UI can
    // distinguish "set the key" from "the model hesitated."
    const status = msg.includes('ANTHROPIC_API_KEY not set') ? 503 : 500;
    return c.json({ ok: false, error: msg }, status);
  }
});

// PUT /api/artists/:slug/profile — artist edits any of the
// synthesized fields + socials.
const ProfileBody = z.object({
  mission_statement: z.string().max(400).optional(),
  studio_rhythm:     z.string().max(2000).optional(),
  process_note:      z.string().max(4000).optional(),
  vocation_statement: z.string().max(400).optional(),
  instagram_handle:  z.string().max(60).optional(),
  x_handle:          z.string().max(60).optional(),
  personal_url:      z.string().url().max(400).optional().or(z.literal('')),
  profile_published: z.boolean().optional(),
  // ISO date (YYYY-MM-DD) or empty to clear. Past dates clear too.
  sabbatical_until:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  trained_under:     z.string().max(400).optional(),
  trained_under_slug: z.string().max(120).optional().or(z.literal('')),
  working_toward_feasts: z.array(z.string().max(80)).max(40).optional(),
});
app.put('/:slug/profile', requireAuth(), async (c) => {
  const slug = c.req.param('slug');
  const ownership = await assertArtistOwnership(c.env, slug, c.var.user!);
  if (!ownership) return c.json({ ok: false, error: 'forbidden' }, 403);
  const parsed = ProfileBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const d = parsed.data;
  // Build a dynamic UPDATE; only set fields that were provided.
  const sets: string[] = [];
  const binds: unknown[] = [];
  const set = (col: string, v: unknown) => {
    if (v !== undefined) { sets.push(`${col} = ?`); binds.push(v); }
  };
  set('mission_statement', d.mission_statement);
  set('studio_rhythm', d.studio_rhythm);
  set('process_note', d.process_note);
  set('vocation_statement', d.vocation_statement);
  set('instagram_handle', d.instagram_handle ?? null);
  set('x_handle', d.x_handle ?? null);
  set('personal_url', d.personal_url || null);
  set('sabbatical_until', d.sabbatical_until || null);
  set('trained_under', d.trained_under ?? null);
  set('trained_under_slug', d.trained_under_slug || null);
  if (d.working_toward_feasts !== undefined) {
    sets.push('working_toward_feasts = ?');
    binds.push(JSON.stringify(d.working_toward_feasts));
  }
  if (d.profile_published !== undefined) {
    sets.push('profile_published = ?');
    binds.push(d.profile_published ? 1 : 0);
  }
  if (sets.length === 0) return c.json({ ok: true });
  sets.push('updated_at = ?');
  binds.push(nowIso());
  binds.push(ownership.id);
  await run(c.env.DB,
    `UPDATE artists SET ${sets.join(', ')} WHERE id = ?`, ...binds);
  return c.json({ ok: true });
});

// POST /api/artists/:slug/house — the authenticated patron designates
// this artist their "house artist." A small, one-way commitment from
// the patron; the artist's public profile shows an anonymized count.
app.post('/:slug/house', requireAuth(), async (c) => {
  const u = c.var.user!;
  const slug = c.req.param('slug');
  const a = await first<{ id: string }>(c.env.DB,
    `SELECT id FROM artists WHERE slug = ?`, slug);
  if (!a) return c.json({ ok: false, error: 'not found' }, 404);
  await run(c.env.DB,
    `INSERT INTO house_artists (user_id, artist_id) VALUES (?, ?)
       ON CONFLICT(user_id, artist_id) DO NOTHING`,
    u.id, a.id);
  return c.json({ ok: true });
});

// DELETE /api/artists/:slug/house — patron releases the designation.
app.delete('/:slug/house', requireAuth(), async (c) => {
  const u = c.var.user!;
  const slug = c.req.param('slug');
  const a = await first<{ id: string }>(c.env.DB,
    `SELECT id FROM artists WHERE slug = ?`, slug);
  if (!a) return c.json({ ok: false, error: 'not found' }, 404);
  await run(c.env.DB,
    `DELETE FROM house_artists WHERE user_id = ? AND artist_id = ?`,
    u.id, a.id);
  return c.json({ ok: true });
});

// GET /api/artists/:slug/house — public count + "is current user a
// house patron of this artist?" If unauthenticated, mine: false.
app.get('/:slug/house', async (c) => {
  const slug = c.req.param('slug');
  const a = await first<{ id: string }>(c.env.DB,
    `SELECT id FROM artists WHERE slug = ?`, slug);
  if (!a) return c.json({ ok: false, error: 'not found' }, 404);
  const countRow = await first<{ n: number }>(c.env.DB,
    `SELECT COUNT(*) AS n FROM house_artists WHERE artist_id = ?`, a.id);
  let mine = false;
  if (c.var.user) {
    const row = await first(c.env.DB,
      `SELECT 1 FROM house_artists WHERE user_id = ? AND artist_id = ?`,
      c.var.user.id, a.id);
    mine = Boolean(row);
  }
  return c.json({ count: countRow?.n ?? 0, mine });
});

// GET /api/artists/:slug/patron-families — public. Groups completed
// commissions by patron_email, returns anonymized households. Names
// are first + last initial; emails are domain only. Useful to surface
// "the Beauchamp family · 3 commissions · 2014–2026" on the profile.
app.get('/:slug/patron-families', async (c) => {
  const slug = c.req.param('slug');
  const a = await first<{ id: string }>(c.env.DB,
    `SELECT id FROM artists WHERE slug = ?`, slug);
  if (!a) return c.json({ ok: false, error: 'not found' }, 404);
  const rows = await all<{
    patron_email: string;
    patron_name: string;
    n: number;
    first_at: string;
    last_at: string;
  }>(c.env.DB,
    `SELECT patron_email,
            MAX(patron_name) AS patron_name,
            COUNT(*) AS n,
            MIN(created_at) AS first_at,
            MAX(completed_at) AS last_at
       FROM commissions
       WHERE artist_id = ?
         AND stage IN ('delivered','blessed')
       GROUP BY patron_email
       HAVING COUNT(*) > 1
       ORDER BY n DESC, last_at DESC
       LIMIT 20`,
    a.id);
  const anonName = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };
  return c.json({
    families: rows.map((r) => ({
      household: anonName(r.patron_name),
      domain: (r.patron_email.split('@')[1] ?? '').toLowerCase(),
      commissions: r.n,
      first_year: r.first_at?.slice(0, 4),
      last_year: r.last_at?.slice(0, 4) ?? r.first_at?.slice(0, 4),
    })),
  });
});

// GET /api/artists/:slug/earnings.csv?year=YYYY — artist or operator
// downloads a tax-ready record of every commission released to them
// in the given year (or all years if year is omitted). Output is
// Schedule C / 1099-K-friendly: one row per released escrow milestone.
app.get('/:slug/earnings.csv', requireAuth(), async (c) => {
  const slug = c.req.param('slug');
  const ownership = await assertArtistOwnership(c.env, slug, c.var.user!);
  if (!ownership) return c.json({ ok: false, error: 'forbidden' }, 403);
  const year = c.req.query('year');
  const yearFilter = year && /^\d{4}$/.test(year) ? year : null;

  // Released escrow rows joined to their commissions. The artist's
  // taxable income is the released amount on each milestone.
  const rows = await all<{
    released_at: string;
    commission_id: string;
    patron_name: string;
    patron_email: string;
    scope: string;
    category_slug: string | null;
    stage: string;
    amount_usd: number;
    certificate_serial: string | null;
    certificate_title: string | null;
  }>(c.env.DB,
    `SELECT e.released_at, e.commission_id, c.patron_name, c.patron_email,
            c.scope, c.category_slug, e.stage, e.amount_usd,
            c.certificate_serial, c.certificate_title
       FROM commission_escrow e
       JOIN commissions c ON c.id = e.commission_id
       WHERE c.artist_id = ?
         AND e.status = 'released'
         ${yearFilter ? `AND e.released_at LIKE ?` : ''}
       ORDER BY e.released_at ASC`,
    ...[ownership.id, ...(yearFilter ? [`${yearFilter}%`] : [])],
  );

  // Build CSV. Escape any field containing comma, quote, or newline.
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    'Date released',
    'Commission ID',
    'Patron (anonymized)',
    'Patron email domain',
    'Work title',
    'Category',
    'Milestone',
    'Amount (USD)',
    'Certificate serial',
  ];
  const anon = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };
  const lines = [header.map(esc).join(',')];
  let total = 0;
  for (const r of rows) {
    total += r.amount_usd;
    lines.push([
      r.released_at?.slice(0, 10),
      r.commission_id,
      anon(r.patron_name),
      (r.patron_email.split('@')[1] ?? '').toLowerCase(),
      r.certificate_title ?? (r.scope.split('\n')[0]?.slice(0, 80) ?? ''),
      r.category_slug ?? '',
      r.stage,
      (r.amount_usd / 1).toFixed(2),
      r.certificate_serial ?? '',
    ].map(esc).join(','));
  }
  lines.push('');
  lines.push([
    '', '', '', '', 'TOTAL', '', '',
    (total / 1).toFixed(2), '',
  ].map(esc).join(','));

  const filename = `locavit-earnings-${slug}${yearFilter ? `-${yearFilter}` : ''}.csv`;
  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
});

// POST /api/artists/:slug/verifications/request — artist or operator.
// Creates a pending verification, sends a one-click endorsement email
// to the pastor (or chancery contact, or religious superior).
const RequestBody = z.object({
  pastor_email: z.string().email(),
  pastor_name: z.string().min(1).max(200).optional(),
  parish_or_community: z.string().min(1).max(200),
  parish_website: z.string().url().max(400).optional().or(z.literal('')),
  diocese: z.string().max(200).optional(),
  role: z.enum(['pastor', 'religious-superior', 'chancery']).default('pastor'),
});
app.post('/:slug/verifications/request', requireAuth(), async (c) => {
  const slug = c.req.param('slug');
  const ownership = await assertArtistOwnership(c.env, slug, c.var.user!);
  if (!ownership) return c.json({ ok: false, error: 'forbidden' }, 403);
  const parsed = RequestBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: parsed.error.flatten() }, 400);
  const d = parsed.data;

  // Token: 256-bit random, URL-safe. Two UUIDs joined for headroom.
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString();

  // Free-webmail flag — important for trust signals downstream.
  const freeWebmail = /@(gmail|yahoo|hotmail|outlook|aol|icloud|protonmail|fastmail)\./i.test(d.pastor_email);

  const verId = newId('ver');
  await run(c.env.DB,
    `INSERT INTO verifications (
       id, artist_id, token, status, role, verifier_name, verifier_email,
       verifier_email_is_free_webmail, parish_or_community, parish_website,
       diocese, expires_at
     ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
    verId, ownership.id, token, d.role,
    d.pastor_name ?? '(awaiting reply)',
    d.pastor_email.toLowerCase(),
    freeWebmail ? 1 : 0,
    d.parish_or_community, d.parish_website || null,
    d.diocese ?? null, expiresAt,
  );

  // Look up the artist for the email body.
  const artist = await first<{ name: string; honorific: string | null; slug: string; city: string }>(
    c.env.DB,
    `SELECT name, honorific, slug, city FROM artists WHERE id = ?`,
    ownership.id,
  );

  // Send the one-click email.
  const link = `${c.env.SITE_URL}/verify/${token}`;
  const event = pastorEndorsementRequest(
    c.env.SITE_URL,
    {
      pastor_email: d.pastor_email,
      pastor_name: d.pastor_name,
      parish_or_community: d.parish_or_community,
      artist_name: artist?.name ?? 'an artist',
      artist_honorific: artist?.honorific ?? null,
      artist_city: artist?.city ?? '',
      role: d.role,
    },
    link,
  );
  await sendEmail(c.env, {
    kind: 'verification.requested',
    payload: { verification_id: verId, artist_slug: artist?.slug ?? slug },
    ...event,
  });

  return c.json({ ok: true, verification_id: verId, expires_at: expiresAt });
});

// GET /api/artists/:slug/verifications — list this artist's
// outstanding & past verification requests. Owner or operator.
app.get('/:slug/verifications', requireAuth(), async (c) => {
  const slug = c.req.param('slug');
  const ownership = await assertArtistOwnership(c.env, slug, c.var.user!);
  if (!ownership) return c.json({ ok: false, error: 'forbidden' }, 403);
  const rows = await all(c.env.DB,
    `SELECT id, status, role, verifier_name, verifier_email,
            parish_or_community, diocese, created_at, endorsed_at, expires_at
       FROM verifications WHERE artist_id = ?
       ORDER BY created_at DESC`,
    ownership.id);
  return c.json({ verifications: rows });
});

function serialize(a: ArtistRow) {
  let bio: string[] = [];
  try {
    bio = JSON.parse(a.bio);
  } catch {
    /* ignore */
  }
  let workingTowardFeasts: string[] = [];
  try {
    workingTowardFeasts = a.working_toward_feasts
      ? (JSON.parse(a.working_toward_feasts) as string[])
      : [];
  } catch {
    /* ignore */
  }
  return {
    ...a,
    bio,
    accepting_commissions: Boolean(a.accepting_commissions),
    custom_pricing: Boolean(a.custom_pricing),
    profile_published: Boolean(a.profile_published ?? 0),
    working_toward_feasts: workingTowardFeasts,
  };
}

export default app;
