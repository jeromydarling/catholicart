import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import {
  clearSession,
  consumeMagicLink,
  createSession,
  issueMagicLink,
  requireAuth,
} from '../lib/auth';
import { sendEmail } from '../lib/email';
import { magicLinkToVerifier } from '../lib/email-templates';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const LoginBody = z.object({ email: z.string().email() });

// Rate limits — per-IP and per-email windows. Stored in KV CACHE so
// limits span the global edge network.
const RL_WINDOW_S = 60 * 60;          // 1 hour
const RL_MAX_PER_IP = 10;             // 10 login requests / hr / IP
const RL_MAX_PER_EMAIL = 3;           // 3 magic-links / hr / address

app.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = LoginBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'invalid email' }, 400);
  }
  const email = parsed.data.email.toLowerCase();
  const ip = c.req.header('cf-connecting-ip') ?? 'unknown';

  const ipKey = `rl:login:ip:${ip}`;
  const emailKey = `rl:login:em:${email}`;
  const [ipCt, emCt] = await Promise.all([
    c.env.CACHE.get(ipKey),
    c.env.CACHE.get(emailKey),
  ]);
  // Quietly succeed when over the limit — don't leak rate-limit state
  // to scrapers, and don't deny the user a way to retry later. They
  // just won't get more mail this hour.
  if (Number(ipCt ?? 0) >= RL_MAX_PER_IP || Number(emCt ?? 0) >= RL_MAX_PER_EMAIL) {
    return c.json({ ok: true, message: 'Check your inbox for a sign-in link.' });
  }
  await Promise.all([
    c.env.CACHE.put(ipKey, String(Number(ipCt ?? 0) + 1), { expirationTtl: RL_WINDOW_S }),
    c.env.CACHE.put(emailKey, String(Number(emCt ?? 0) + 1), { expirationTtl: RL_WINDOW_S }),
  ]);

  const link = await issueMagicLink(c.env, email);
  const event = magicLinkToVerifier(c.env.SITE_URL, { email }, link, false);
  await sendEmail(c.env, { kind: 'auth.magic_link', payload: { email }, ...event });

  return c.json({ ok: true, message: 'Check your inbox for a sign-in link.' });
});

app.get('/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ ok: false, error: 'missing token' }, 400);
  try {
    const result = await consumeMagicLink(c.env, token);
    if (!result) return c.redirect('/?auth=expired');
    await createSession(c.env, c, result.user_id);
    return c.redirect('/dashboard?auth=ok');
  } catch {
    // AUTH_SECRET missing or DB hiccup. Don't burn a fresh link.
    return c.redirect('/?auth=failed');
  }
});

app.post('/logout', requireAuth(), async (c) => {
  await clearSession(c.env, c);
  return c.json({ ok: true });
});

app.get('/me', async (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json({ user: c.var.user ?? null });
});

export default app;
