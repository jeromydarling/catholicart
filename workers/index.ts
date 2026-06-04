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

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', cors({ origin: (origin) => origin ?? '*', credentials: true }));
app.use('*', withAuth());

// API surface
app.get('/api/health', (c) =>
  c.json({ ok: true, time: new Date().toISOString() }),
);
app.route('/api/auth', auth);
app.route('/api/artists', artists);
app.route('/api/commissions', commissions);
app.route('/api', reference);              // /api/categories, /api/saints, etc.
app.route('/api/intakes', intakes);
app.route('/api/upload', upload);
app.route('/api', misc);                    // /api/ledger, /api/preferences/*, /api/subscribe, /api/apprenticeships

// Fallback: serve the SPA for anything that isn't an API or asset.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
