// Artist directory: list, get by slug, full-text search, filter,
// recommend similar. Backed by D1 + FTS5.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { all, first, nowIso, run } from '../lib/db';
import { requireAuth, requireRole } from '../lib/auth';
import { synthesizeVocation, type QuestionnaireResponses } from '../lib/synthesize';

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

function serialize(a: ArtistRow) {
  let bio: string[] = [];
  try {
    bio = JSON.parse(a.bio);
  } catch {
    /* ignore */
  }
  return {
    ...a,
    bio,
    accepting_commissions: Boolean(a.accepting_commissions),
    custom_pricing: Boolean(a.custom_pricing),
    profile_published: Boolean(a.profile_published ?? 0),
  };
}

export default app;
