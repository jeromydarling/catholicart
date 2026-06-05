// /api/artists/:slug/payouts — get and update the artist's payout
// preference. Restricted to the artist owner and operators.

import { Hono } from 'hono';
import type { Env, AppVariables } from '../types';
import { getPreference, upsertPreference } from '../lib/payouts';
import type { PayoutMethod, PayoutPreference } from '../lib/payouts/types';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

async function resolveArtistId(db: D1Database, slug: string): Promise<{ id: string; user_id: string | null } | null> {
  return db
    .prepare('SELECT id, user_id FROM artists WHERE slug = ?')
    .bind(slug)
    .first<{ id: string; user_id: string | null }>();
}

function canEdit(user: AppVariables['user'], artistUserId: string | null): boolean {
  if (!user) return false;
  if (user.role === 'operator') return true;
  return user.role === 'artist' && artistUserId === user.id;
}

const ALLOWED: PayoutMethod[] = [
  'unset',
  'stripe_connect',
  'wise',
  'paper_check',
  'paypal',
  'manual_wire',
];

const EDITABLE: Array<keyof PayoutPreference> = [
  'method',
  'wise_currency',
  'wise_account_holder_name',
  'wise_iban',
  'wise_bank_code',
  'wise_account_number',
  'wise_country',
  'check_payee_name',
  'check_address_line1',
  'check_address_line2',
  'check_city',
  'check_state',
  'check_postal_code',
  'check_country',
  'paypal_email',
  'manual_wire_notes',
];

app.get('/artists/:slug/payouts', async (c) => {
  const u = c.get('user');
  if (!u) return c.json({ error: 'auth_required' }, 401);
  const artist = await resolveArtistId(c.env.DB, c.req.param('slug'));
  if (!artist) return c.json({ error: 'not_found' }, 404);
  if (!canEdit(u, artist.user_id)) return c.json({ error: 'forbidden' }, 403);
  const pref = await getPreference(c.env.DB, artist.id);
  return c.json({ preference: pref ?? { method: 'unset' } });
});

app.put('/artists/:slug/payouts', async (c) => {
  const u = c.get('user');
  if (!u) return c.json({ error: 'auth_required' }, 401);
  const artist = await resolveArtistId(c.env.DB, c.req.param('slug'));
  if (!artist) return c.json({ error: 'not_found' }, 404);
  if (!canEdit(u, artist.user_id)) return c.json({ error: 'forbidden' }, 403);

  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json({ error: 'invalid_json' }, 400);

  if (body.method !== undefined && !ALLOWED.includes(body.method as PayoutMethod)) {
    return c.json({ error: 'invalid_method' }, 400);
  }

  const patch: Partial<PayoutPreference> = {};
  for (const f of EDITABLE) {
    if (f in body) {
      const v = body[f];
      (patch as Record<string, unknown>)[f] = typeof v === 'string' ? v.trim() || null : v ?? null;
    }
  }

  await upsertPreference(c.env.DB, artist.id, patch);
  const updated = await getPreference(c.env.DB, artist.id);
  return c.json({ ok: true, preference: updated });
});

export default app;
