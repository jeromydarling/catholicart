// Artist directory: list, get by slug, full-text search, filter,
// recommend similar. Backed by D1 + FTS5.

import { Hono } from 'hono';
import type { Env, AppVariables } from '../types';
import { all, first } from '../lib/db';

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
    // FTS5 against artists_fts. Returns rowid back into the join.
    join += ' JOIN artists_fts ON artists.rowid = artists_fts.rowid';
    where.push(`artists_fts MATCH ?`);
    binds.push(q);
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
  };
}

export default app;
