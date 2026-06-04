// R2 upload for commission WIP photos. Two-step:
//
//   1. POST /api/upload/wip  → server validates ownership, generates a
//      random key under `commissions/<commission_id>/wip/<random>.<ext>`,
//      signs the key into a short-lived token, returns the token-bearing
//      PUT URL.
//   2. PUT /api/upload/put?k=<token>  → server verifies the token,
//      writes to R2, enforces size + content-type.
//   3. GET /api/upload/get?k=<token>  → server verifies token, streams
//      from R2.
//
// SECURITY
// - Auth required on every step (no anonymous reads or writes).
// - For writes, the caller must be patron or artist on the commission.
// - The R2 key never crosses the trust boundary in plaintext; the
//   client gets a signed token instead, preventing path traversal and
//   cross-commission overwrites.
// - Content-Type whitelist limits what can be uploaded (and what's
//   served back with what header).
// - Size capped at 25MB.

import { Hono } from 'hono';
import { z } from 'zod';
import { SignJWT, jwtVerify } from 'jose';
import type { Env, AppVariables } from '../types';
import { first, newId } from '../lib/db';
import { requireAuth } from '../lib/auth';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);
const TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

function key(env: Env): Uint8Array {
  const s = env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET missing');
  return new TextEncoder().encode(s);
}

async function signR2Key(env: Env, k: string, mode: 'put' | 'get'): Promise<string> {
  return new SignJWT({ k, m: mode })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60 * 15) // 15 min
    .sign(key(env));
}

async function verifyR2Token(env: Env, tok: string, mode: 'put' | 'get'): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(tok, key(env));
    if ((payload as { m?: string }).m !== mode) return null;
    const k = (payload as { k?: string }).k;
    if (typeof k !== 'string' || !k.startsWith('commissions/')) return null;
    return k;
  } catch {
    return null;
  }
}

async function assertCommissionParticipant(
  env: Env,
  user: { id: string; email: string; role: string },
  commissionId: string,
): Promise<boolean> {
  if (user.role === 'operator') return true;
  const cm = await first<{ artist_id: string; patron_id: string | null; patron_email: string }>(
    env.DB,
    `SELECT artist_id, patron_id, patron_email FROM commissions WHERE id = ?`,
    commissionId,
  );
  if (!cm) return false;
  if (cm.patron_id === user.id) return true;
  if (cm.patron_email.toLowerCase() === user.email.toLowerCase()) return true;
  const artist = await first<{ user_id: string | null }>(
    env.DB,
    `SELECT user_id FROM artists WHERE id = ?`,
    cm.artist_id,
  );
  return artist?.user_id === user.id;
}

const WipBody = z.object({
  commission_id: z.string().min(1).max(80),
  content_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
    .default('image/jpeg'),
});

// POST /api/upload/wip — request a signed PUT URL.
app.post('/wip', requireAuth(), async (c) => {
  const u = c.var.user!;
  const parsed = WipBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: 'bad request' }, 400);
  if (!(await assertCommissionParticipant(c.env, u, parsed.data.commission_id))) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }

  const ext = TYPE_TO_EXT[parsed.data.content_type] ?? 'jpg';
  const k = `commissions/${parsed.data.commission_id}/wip/${newId('img')}.${ext}`;
  const putToken = await signR2Key(c.env, k, 'put');
  const getToken = await signR2Key(c.env, k, 'get');
  return c.json({
    upload_url: `/api/upload/put?k=${encodeURIComponent(putToken)}`,
    image_url: `/api/upload/get?k=${encodeURIComponent(getToken)}`,
    key: k,
  });
});

// PUT /api/upload/put?k=<signed> — body is the file, size-capped.
app.put('/put', requireAuth(), async (c) => {
  const tok = c.req.query('k') ?? '';
  const k = await verifyR2Token(c.env, tok, 'put');
  if (!k) return c.json({ ok: false, error: 'bad token' }, 401);

  const ct = c.req.header('content-type')?.split(';')[0]?.trim() ?? '';
  if (!ALLOWED_TYPES.has(ct)) {
    return c.json({ ok: false, error: 'unsupported content-type' }, 415);
  }

  const body = await c.req.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return c.json({ ok: false, error: 'file too large (max 25MB)' }, 413);
  }
  await c.env.BUCKET.put(k, body, { httpMetadata: { contentType: ct } });
  return c.json({ ok: true, key: k });
});

// GET /api/upload/get?k=<signed> — auth required (private images).
app.get('/get', requireAuth(), async (c) => {
  const tok = c.req.query('k') ?? '';
  const k = await verifyR2Token(c.env, tok, 'get');
  if (!k) return c.json({ ok: false, error: 'bad token' }, 401);
  const obj = await c.env.BUCKET.get(k);
  if (!obj) return c.json({ ok: false, error: 'not found' }, 404);
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'cache-control': 'private, max-age=300',
      'etag': obj.httpEtag,
    },
  });
});

export default app;
