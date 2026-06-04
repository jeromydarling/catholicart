# Full-Cloudflare deployment guide

This branch (`claude/cloudflare-native-stack`) carries the full back-end
foundation for the catholicart Worker:

- **D1** (SQLite at the edge) for the database, with FTS5 for artist
  search
- **R2** for WIP photo uploads
- **KV** for session storage + caching
- **Workers AI** binding (available, not yet wired into a feature)
- **Hono** router serving `/api/*` from the same Worker that serves the
  SPA — single domain, no CORS dance
- **Magic-link auth** via Resend with signed JWT cookies (jose)
- **Outbox** D1 table for an audit log of every email sent

This document is the activation checklist. Follow it once and you're
running on the full-Cloudflare stack.

---

## 1. Merge this PR

The branch is `claude/cloudflare-native-stack`. Open a PR against
`main` and merge. CF will build + deploy the new Worker. The site will
keep working from the existing SPA (which still uses localStorage for
data) until you finish step 2.

## 2. Bootstrap the Cloudflare resources

This is the one-button workflow that creates D1, R2, KV; writes the
real resource IDs into `wrangler.jsonc`; runs all migrations; commits
the updated `wrangler.jsonc` back to `main`; triggers a redeploy.

1. Open https://github.com/jeromydarling/catholicart/actions/workflows/cf-bootstrap-cloud.yml
2. Click the green **Run workflow** dropdown
3. Click **Run workflow** (no inputs)
4. Wait ~60 seconds — it'll commit a new wrangler.jsonc which triggers
   CF Pages to redeploy with the bindings live

What it creates:

| Resource | Name | Binding in Worker |
|---|---|---|
| D1 database | `catholicart` | `env.DB` |
| R2 bucket | `catholicart-wip` | `env.BUCKET` |
| KV namespace | `catholicart-cache` | `env.CACHE` |
| KV namespace | `catholicart-sessions` | `env.SESSIONS` |

What it runs:

- `migrations/d1/0001_init.sql` — full schema (25 tables, FTS5)
- `migrations/d1/0002_seed.sql` — categories, saints, dioceses, orders
- `migrations/d1/0003_seed_artists.sql` — all 12 seed artists with
  their categories, saints, tiers, artworks

## 3. Set Worker secrets

These are the secrets the Worker needs at runtime. Set via the
`cf-worker-secret-bulk` workflow (one click) or the `cf-worker-secret`
workflow per-variable.

| Secret | Where to get | Critical? |
|---|---|---|
| `VITE_MAPBOX_TOKEN` | https://account.mapbox.com/access-tokens | Yes — for the map |
| `VITE_MAPBOX_STYLE` | Your custom style URL | No — falls back to `mapbox/light-v11` |
| `VITE_SENTRY_DSN` | sentry.io → Project Settings → Client Keys | No — silently no-ops if unset |
| `RESEND_API_KEY` | https://resend.com/api-keys | Yes — for outbound email |
| `AUTH_SECRET` | Generate: `openssl rand -base64 32` | Yes — signs session JWTs |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | No — Stripe not wired yet |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | No — Stripe not wired yet |

For `cf-worker-secret-bulk`:

1. Open https://github.com/jeromydarling/catholicart/actions/workflows/cf-worker-secret-bulk.yml
2. **Run workflow** → fill `vite_mapbox_token`, leave others blank
3. **Run workflow** button

For `AUTH_SECRET` and `RESEND_API_KEY` (not in the batch workflow's
schema yet, set via wrangler directly when you're on the laptop):

```bash
echo -n "<generated-secret>" | wrangler secret put AUTH_SECRET
echo -n "re_..."              | wrangler secret put RESEND_API_KEY
```

## 4. Verify

Hit `https://catholicart.workers.dev/api/health` — should return
`{ ok: true, time: "..." }`.

Hit `https://catholicart.workers.dev/api/categories` — should return
the 9 categories from the seed.

Hit `https://catholicart.workers.dev/api/artists` — should return 12
artists with their portraits, cities, starting_at prices, etc.

Then visit `/signin` in a browser, enter your email, and click the
link in the email Resend sends you. You should land back on the site
signed in.

## 5. What's left

This branch sets up the **back-end foundation**. The SPA still uses
`localStorage` for state. Next steps (a follow-up PR):

- **Wire the SPA to the API**: rewrite `src/lib/store.ts` so its
  methods call `api.*` instead of mutating localStorage. The new
  `src/lib/api.ts` already exposes the full surface. Each page would
  add minor loading states.
- **Stripe Connect** for real artist payouts + escrow milestones.
  Stripe webhook handler scaffolded in `supabase/functions/` from the
  earlier work — port to a Worker route at `/api/stripe/webhook`.
- **R2 uploads** wired into the WIP-update form on the Workspace page.
  Presigned-URL infrastructure is built (`/api/upload/wip` and
  `/api/upload/put`), needs UI integration.
- **Workers AI**: similar-artist embeddings (current similar uses a
  Jaccard score; embeddings would be much better), AI-slop detection
  on uploaded WIPs.
- **Cloudflare Images** for automatic WIP photo resizing + per-page OG
  image generation.

## Architecture map

```
catholicart (Worker)
├── workers/index.ts                Hono router; /api/* → API, else → ASSETS
├── workers/types.ts                Env binding interface
├── workers/lib/
│   ├── db.ts                       D1 helpers (first, all, run)
│   ├── auth.ts                     magic-link + JWT + KV session
│   ├── email.ts                    Resend + outbox audit
│   ├── email-templates.ts          Worker-side email HTML
│   └── pricing.ts                  10% fee + 25/35/40 escrow split
└── workers/api/
    ├── auth.ts                     /api/auth/{login,verify,logout,me}
    ├── artists.ts                  /api/artists  (FTS5 + filter)
    ├── commissions.ts              /api/commissions  (full lifecycle)
    ├── intakes.ts                  /api/intakes  (B2B RFP)
    ├── upload.ts                   /api/upload   (R2)
    ├── reference.ts                /api/{categories,saints,dioceses,orders}
    └── misc.ts                     /api/{ledger,preferences,subscribe,apprenticeships}

migrations/d1/
├── 0001_init.sql                   25 tables, FTS5 virtual table + triggers
├── 0002_seed.sql                   9 categories, 20 saints, 12 dioceses, 4 orders
└── 0003_seed_artists.sql           12 artists w/ categories, saints, tiers, works

.github/workflows/
├── cf-bootstrap-cloud.yml          one-click: create D1+R2+KV, patch wrangler.jsonc, migrate
├── cf-worker-secret-bulk.yml       set Mapbox / Sentry secrets
├── cf-worker-list.yml              diagnostic: list workers + secret names
└── cf-diagnose.yml                 diagnostic: list accounts + Pages projects
```

## Cloudflare-specific decisions made

1. **D1 not Postgres.** D1 is SQLite, far less powerful than Postgres,
   but for a low-write art marketplace it's plenty. Lost: JSONB,
   tsvector (replaced by FTS5), enums (replaced by CHECK constraints),
   RLS (replaced by Hono middleware).
2. **Hono not Express.** Hono is the standard Worker router; faster
   cold starts, smaller bundle, Zod validation built-in via
   `@hono/zod-validator`.
3. **jose not bcrypt.** No passwords means no hashing. Magic-link
   tokens are random IDs in D1; session JWTs are signed with HS256
   via jose (works in V8 isolates without polyfills).
4. **KV for session revocation.** JWTs in cookies for the actual
   credential; a parallel KV entry lets us revoke server-side without
   waiting for expiration.
5. **No Lucia or Better-Auth.** Both target Node and have heavy
   dependencies. The 200-line custom flow in `workers/lib/auth.ts`
   does what we need without a 200KB dep.
6. **R2 via Worker proxy, not signed S3 URLs.** Simpler, lets us
   authenticate uploads via the session cookie. Could swap to S3 V4
   signed PUT URLs later if upload throughput becomes a problem.

## Build & deploy

```bash
# local dev (uses wrangler's local D1 + R2 + KV)
npm run dev

# build for production
npm run build       # writes dist/client/ (SPA) + dist/catholicart/ (Worker)

# deploy
npx wrangler deploy
```

CF Pages auto-runs `npx wrangler deploy` on every push to `main` (the
Vite plugin handles this).
