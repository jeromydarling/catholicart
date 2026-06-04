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

app.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = LoginBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'invalid email' }, 400);
  }
  const email = parsed.data.email.toLowerCase();
  const link = await issueMagicLink(c.env, email);

  const event = magicLinkToVerifier(c.env.SITE_URL, { email }, link, false);
  await sendEmail(c.env, { kind: 'auth.magic_link', payload: { email }, ...event });

  return c.json({ ok: true, message: 'Check your inbox for a sign-in link.' });
});

app.get('/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ ok: false, error: 'missing token' }, 400);
  const result = await consumeMagicLink(c.env, token);
  if (!result) {
    return c.redirect('/?auth=expired');
  }
  await createSession(c.env, c, result.user_id);
  return c.redirect('/dashboard?auth=ok');
});

app.post('/logout', requireAuth(), async (c) => {
  await clearSession(c.env, c);
  return c.json({ ok: true });
});

app.get('/me', async (c) => {
  return c.json({ user: c.var.user ?? null });
});

export default app;
