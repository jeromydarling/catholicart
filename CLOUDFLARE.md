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
`main` and merge.

**Expected:** the Cloudflare build will fail the first time, because
`wrangler.jsonc` ships with `__SET_BY_BOOTSTRAP_WORKFLOW__`
placeholders for the D1 + KV resource IDs. The CF build pipeline
validates those before deploying, and rejects them. This is the
trigger for step 2 — running the bootstrap workflow replaces the
placeholders with real IDs, commits the fix back, and the next deploy
succeeds.

The existing SPA keeps working from `localStorage` regardless of
Worker deploy status.

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

**Use `cf-worker-secret-bulk` for everything:**

1. Generate the auth secret locally: `openssl rand -base64 32` → copy
2. Open https://github.com/jeromydarling/catholicart/actions/workflows/cf-worker-secret-bulk.yml
3. **Run workflow** → fill:
   - `vite_mapbox_token` (pk.…)
   - `resend_api_key` (re_…)
   - `auth_secret` (paste the openssl output)
   - leave others blank
4. **Run workflow** button

`wrangler secret put` updates the live Worker immediately — no
redeploy required. The client fetches the public-safe ones
(`VITE_MAPBOX_TOKEN`, `VITE_SENTRY_DSN`) from `/api/config` at
runtime, so changes propagate without rebuilding the SPA.

## 4. Verify

**Easiest:** visit `https://catholicart.workers.dev/api-status` —
it runs 9 live checks and shows pass/fail for each (Worker reachable,
8 categories seeded, 20 saints, 12 dioceses, 4 orders, 12 artists,
FTS5 search working, auth endpoint responsive, ledger responsive).

**From a terminal / CI:** same checks via CLI —

```bash
npm run smoke                              # production
node scripts/api-smoke.mjs --json          # parseable output
BASE=http://localhost:8787 npm run smoke   # against local dev
```

Exit code 0 = all green, 1 = at least one failed.

**Or manually:**

- `/api/health` returns `{ ok: true, time }`
- `/api/categories` returns 8 categories
- `/api/saints` returns 20 saints
- `/api/artists` returns 12 artists
- `/api/artists?q=Maria` returns Maria Chrysostom (FTS5)

Then visit `/signin`, enter your email, and click the link in the
email Resend sends you. You should land back on the site signed in
with the cookie set. (`/api/auth/me` confirms.)

## Troubleshooting

**Run `cf-preflight` first if anything has changed about the API token.**
It tells you exactly which scope is missing in plain English.

| Symptom | Most likely cause | Fix |
|---|---|---|
| `/api/health` returns 404 | Worker isn't deployed yet | wait for CF Pages auto-deploy, or `npx wrangler deploy` |
| `/api/health` 500 with "D1_ERROR" | bootstrap workflow didn't run | run `cf-bootstrap-cloud` |
| `/api/categories` empty array | migrations didn't run | re-run `cf-bootstrap-cloud` (idempotent) |
| Magic-link email never arrives | `RESEND_API_KEY` unset | `wrangler secret put RESEND_API_KEY` |
| Magic-link click → "Invalid token" | `AUTH_SECRET` rotated mid-flight | clear the link, request a new one |
| `cf-bootstrap-cloud` "Authentication error" | API token missing scopes | run `cf-preflight` to identify which |
| `wrangler.jsonc` patch left placeholders | regex changed shape | re-run bootstrap; if it persists, check resource names match `catholicart` |
| Smoke test shows 6 OK but auth fails | KV SESSIONS namespace ID wrong | re-run `cf-preflight` + bootstrap |

## 5. What's left — incremental migration playbook

This PR sets up the **back-end foundation**. The SPA still uses
`localStorage` for state. The pattern for migrating each feature:

1. **Pick a page** (e.g. `/browse`).
2. **Inside that page only**, replace `useStore()` reads with a
   `useEffect` that calls `api.listArtists()`, store in local React
   state. Add a loading skeleton + error state.
3. **Replace mutations** with `api.*` calls. Each becomes async; show
   a brief spinner on the action button while it runs.
4. **Test signed in + signed out**. If the endpoint requires auth and
   the user isn't signed in, the page should bounce to `/signin`.
5. **Verify** by signing in (`/signin`) and walking the migrated
   page in both states — signed-in and signed-out. The endpoints
   listed below have varying auth requirements; the page should
   bounce to `/signin` for the auth-required ones.

Pages in order of payoff:

| Order | Page | Endpoint | Risk |
|---|---|---|---|
| 1 | `/browse` | `api.listArtists` | Low (read-only) |
| 2 | `/artists/:slug` | `api.artist(slug)` + `api.similar(slug)` | Low |
| 3 | `/commission/:slug` | `api.createCommission` | Medium |
| 4 | `/workspace/:id` | `api.commission(id)` + lifecycle calls | High (the big one) |
| 5 | `/ledger` | `api.ledger()` | Low |
| 6 | `/partnerships` + intake | `api.listIntakes` etc. | Medium |
| 7 | `/journal` subscribe + `/apprenticeships` apply | `api.subscribeJournal` + `api.applyApprenticeship` | Low (already two pages) |
| 8 | `/admin` | needs operator role + auth | Medium |

Still deferred:

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
# local dev (uses wrangler's local D1 + R2 + KV via miniflare)
npm run dev

# first time: seed the local D1 with all migrations
npm run db:local

# verify migrations against in-memory SQLite (no wrangler needed)
npm run validate:migrations

# build for production
npm run build       # writes dist/client/ (SPA) + dist/catholicart/ (Worker)

# deploy
npx wrangler deploy

# smoke test the live deploy
npm run smoke
```

CF auto-runs `npx wrangler deploy` on every push to `main` (the Vite
plugin handles this).
