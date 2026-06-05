// Cloudflare Worker entry — Hono router mounted on /api/*, everything
// else falls through to the SPA static assets.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, AppVariables } from './types';
import { withAuth } from './lib/auth';

import auth from './api/auth';
import artists from './api/artists';
import commissions from './api/commissions';
import reference from './api/reference';
import intakes from './api/intakes';
import upload from './api/upload';
import misc from './api/misc';
import verifications from './api/verifications';
import studio from './api/studio';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// CORS allow-list. With `credentials: true`, reflecting any Origin is
// CSRF-equivalent — we lock to known same-origin / future-custom-domain
// hosts. Same-origin requests from the SPA carry no Origin header on
// some paths; we allow those through.
const ALLOWED_ORIGINS = new Set([
  'https://catholicart.jer-f84.workers.dev',
  'https://locavit.com',
  'https://www.locavit.com',
  // local dev
  'http://localhost:5173',
  'http://localhost:8787',
]);
app.use('*', cors({
  origin: (origin) => (origin && ALLOWED_ORIGINS.has(origin) ? origin : ''),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 600,
}));

// Baseline security headers on every response.
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('X-Frame-Options', 'DENY');
});

app.use('*', withAuth());

// API surface
app.get('/api/health', (c) =>
  c.json({ ok: true, time: new Date().toISOString() }),
);

// Public-safe client config. Mapbox pk.* tokens + Sentry DSNs are
// designed to be exposed to the browser, so we serve them here at
// runtime rather than baking them into the Vite bundle. This lets
// `wrangler secret put VITE_MAPBOX_TOKEN` propagate without a
// rebuild.
//
// Also includes `flags` — booleans indicating whether server-side
// secrets are wired. Never includes the secret values themselves.
app.get('/api/config', (c) => {
  c.header('Cache-Control', 'public, max-age=60, s-maxage=60');
  return c.json({
    mapbox_token: c.env.VITE_MAPBOX_TOKEN ?? '',
    mapbox_style: c.env.VITE_MAPBOX_STYLE ?? '',
    sentry_dsn: c.env.VITE_SENTRY_DSN ?? '',
    site_url: c.env.SITE_URL,
    flags: {
      email_configured: Boolean(c.env.EMAIL && typeof c.env.EMAIL.send === 'function'),
      auth_secret_configured: Boolean(c.env.AUTH_SECRET),
      stripe_configured: Boolean(c.env.STRIPE_SECRET_KEY),
      anthropic_configured: Boolean(c.env.ANTHROPIC_API_KEY),
    },
  });
});
app.route('/api/auth', auth);
app.route('/api/artists', artists);
app.route('/api/commissions', commissions);
app.route('/api', reference);              // /api/categories, /api/saints, etc.
app.route('/api/intakes', intakes);
app.route('/api/upload', upload);
app.route('/api/verifications', verifications);
app.route('/api/studio', studio);
app.route('/api', misc);                    // /api/ledger, /api/preferences/*, /api/subscribe, /api/apprenticeships

// Unmatched /api/* returns JSON 404 (not the SPA shell).
app.all('/api/*', (c) => c.json({ ok: false, error: 'not found' }, 404));

// Fallback: serve the SPA for anything that isn't an API or asset.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

// Scheduled handlers. Two crons (declared in wrangler.jsonc):
//   "0 */6 * * *" — every 6 hours: prune the magic_links table.
//   "0 8 1 1 *"   — January 1 at 08:00 UTC: send the annual season
//                    letter to every artist with work completed in
//                    the previous year.
import { sendSeasonLetters } from './lib/season-letter';

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (event.cron === '0 8 1 1 *') {
      const lastYear = new Date().getUTCFullYear() - 1;
      ctx.waitUntil(sendSeasonLetters(env, lastYear).then((r) =>
        console.log(`season letters: sent=${r.sent} skipped=${r.skipped}`),
      ));
      return;
    }
    // Default: 6-hourly magic_links GC.
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    await env.DB
      .prepare(`DELETE FROM magic_links WHERE expires_at < ?`)
      .bind(cutoff)
      .run();
  },
} satisfies ExportedHandler<Env>;
