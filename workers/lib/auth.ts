// Magic-link auth backed by D1 + KV sessions + signed JWT cookies.
//
// Flow:
//   1. POST /api/auth/login { email } — issues a magic link, sends via Cloudflare Email.
//   2. GET  /api/auth/verify?token=… — exchanges magic link for session JWT
//      stored in a cookie + KV (so we can revoke server-side).
//   3. Subsequent requests carry the cookie; middleware loads the user.
//   4. POST /api/auth/logout — clears the cookie + KV entry.

import { SignJWT, jwtVerify } from 'jose';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Env, AppVariables } from '../types';
import { first, newId, nowIso } from './db';

const COOKIE = 'arssacra_session';
const SESSION_TTL_S = 60 * 60 * 24 * 30; // 30 days
const MAGIC_LINK_TTL_S = 60 * 30;          // 30 minutes

interface SessionPayload {
  sub: string;       // user id
  email: string;
  role: string;
  exp: number;
}

function keyOrFail(env: Env): Uint8Array {
  const secret = env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET missing or too short — refusing to sign or verify sessions');
  }
  return new TextEncoder().encode(secret);
}

async function jwtRevKey(jwt: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jwt));
  return 's:' + Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function issueMagicLink(env: Env, email: string): Promise<string> {
  const token = newId('mlt');
  const expires = new Date(Date.now() + MAGIC_LINK_TTL_S * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO magic_links (token, email, expires_at) VALUES (?, ?, ?)`,
  )
    .bind(token, email.toLowerCase(), expires)
    .run();
  return `${env.SITE_URL}/api/auth/verify?token=${token}`;
}

export async function consumeMagicLink(
  env: Env,
  token: string,
): Promise<{ user_id: string; email: string } | null> {
  // Atomic consume: only one concurrent claim wins. Combines the
  // expiry + used_at check into the UPDATE itself, so a race that
  // reads the row and the marker simultaneously can't double-claim.
  const now = nowIso();
  const claim = await env.DB
    .prepare(
      `UPDATE magic_links
         SET used_at = ?
         WHERE token = ?
           AND used_at IS NULL
           AND expires_at > ?`,
    )
    .bind(now, token, now)
    .run();
  if ((claim.meta?.changes ?? 0) !== 1) return null;

  const row = await first<{ email: string }>(
    env.DB,
    `SELECT email FROM magic_links WHERE token = ?`,
    token,
  );
  if (!row) return null;

  // Find or create user
  let user = await first<{ id: string; email: string; role: string }>(
    env.DB,
    `SELECT id, email, role FROM users WHERE email = ?`,
    row.email,
  );
  if (!user) {
    const id = newId('usr');
    await env.DB.prepare(
      `INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)`,
    )
      .bind(id, row.email, row.email.split('@')[0])
      .run();
    user = { id, email: row.email, role: 'patron' };
  }

  // Auto-link an artist row if the operator pre-registered this email
  // via POST /api/artists/:slug/claim. Promotes the user to 'artist'
  // role at the same time so they see the artist dashboard.
  const linked = await env.DB
    .prepare(
      `UPDATE artists SET user_id = ?
         WHERE user_email = ? AND user_id IS NULL`,
    )
    .bind(user.id, row.email)
    .run();
  if ((linked.meta?.changes ?? 0) > 0 && user.role !== 'operator') {
    await env.DB
      .prepare(`UPDATE users SET role = 'artist' WHERE id = ? AND role != 'operator'`)
      .bind(user.id)
      .run();
  }

  return { user_id: user.id, email: user.email };
}

export async function createSession(
  env: Env,
  c: Context,
  userId: string,
): Promise<void> {
  const user = await first<{
    id: string;
    email: string;
    role: string;
  }>(env.DB, `SELECT id, email, role FROM users WHERE id = ?`, userId);
  if (!user) throw new Error('user not found');

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const jwt = await new SignJWT({
    email: user.email,
    role: user.role,
  })
    .setSubject(user.id)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(keyOrFail(env));

  // Record in KV so we can revoke server-side. KV key is a hash of
  // the JWT to stay under the 512-byte key limit regardless of how
  // claims grow.
  await env.SESSIONS.put(await jwtRevKey(jwt), user.id, {
    expirationTtl: SESSION_TTL_S,
  });

  setCookie(c, COOKIE, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: SESSION_TTL_S,
  });
}

export async function loadSession(
  env: Env,
  c: Context,
): Promise<AppVariables['user'] | null> {
  const jwt = getCookie(c, COOKIE);
  if (!jwt) return null;

  // Check KV first for revocation. Hash JWT to stay under KV key limit.
  const revKey = await jwtRevKey(jwt);
  const valid = await env.SESSIONS.get(revKey);
  if (!valid) return null;

  try {
    const { payload } = await jwtVerify(jwt, keyOrFail(env));
    const p = payload as unknown as SessionPayload;
    return {
      id: p.sub,
      email: p.email,
      role: (p.role as 'patron' | 'artist' | 'operator') ?? 'patron',
    };
  } catch {
    return null;
  }
}

export async function clearSession(env: Env, c: Context): Promise<void> {
  const jwt = getCookie(c, COOKIE);
  if (jwt) {
    await env.SESSIONS.delete(await jwtRevKey(jwt));
  }
  deleteCookie(c, COOKIE, { path: '/' });
}

// Middleware: attach user to c.var.user if signed in.
export function withAuth(): MiddlewareHandler<{
  Bindings: Env;
  Variables: AppVariables;
}> {
  return async (c, next) => {
    const user = await loadSession(c.env, c);
    if (user) c.set('user', user);
    await next();
  };
}

// Middleware: require a signed-in user.
export function requireAuth(): MiddlewareHandler<{
  Bindings: Env;
  Variables: AppVariables;
}> {
  return async (c, next) => {
    if (!c.var.user) {
      return c.json({ ok: false, error: 'unauthorized' }, 401);
    }
    await next();
  };
}

export function requireRole(
  ...allowed: Array<'patron' | 'artist' | 'operator'>
): MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> {
  return async (c, next) => {
    if (!c.var.user) return c.json({ ok: false, error: 'unauthorized' }, 401);
    if (!allowed.includes(c.var.user.role)) {
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }
    await next();
  };
}
