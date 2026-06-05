# Lovable handoff · Locavit

This repository is a production-grade prototype of a marketplace for
commissioning Catholic sacred art. It runs as a Vite + React SPA today,
backed by `localStorage`. This document walks Lovable through everything
needed to make it real: Supabase schema + RLS + seeds, Resend
transactional email, Stripe Connect payouts + escrow, Mapbox map.

## Architecture in one paragraph

A patron commissions a Catholic artist whose application has been
endorsed by their pastor. Payment is held in a three-stage escrow
(25 / 35 / 40); the artist is paid 100% of their quoted price and the
platform fee is added on top, paid by the patron. Every commission
flows through nine stages from scoping → blessed, generates a
provenance certificate, and appears (anonymized) in a public Ledger.
Institutional patrons (dioceses, religious orders) post RFP-style
briefs that receive proposals from guild artists, route through
multi-stakeholder approval, and bill NET-30.

## Stack

| Layer        | Choice                                                        |
|--------------|---------------------------------------------------------------|
| UI           | Vite + React 18 + TypeScript + Tailwind + shadcn/ui           |
| Routing      | react-router-dom (BrowserRouter)                              |
| Animation    | motion (Framer Motion fork)                                   |
| Map          | mapbox-gl (env-gated)                                         |
| Meta / SEO   | react-helmet-async + build-time sitemap                       |
| State        | TODAY: React context + localStorage. NEXT: Supabase + tanstack-query (recommended) |
| Auth         | NEXT: Supabase Auth — magic links + Google OAuth              |
| Database     | NEXT: Supabase Postgres (schema in `supabase/migrations/`)    |
| Storage      | NEXT: Supabase Storage bucket `wip-images` (public read)       |
| Email        | Resend via `supabase/functions/notify`                        |
| Payments     | Stripe Connect Express via `supabase/functions/stripe-webhook` |
| Analytics    | PostHog (wizard-installed; key in env)                        |

## 1. Provision Supabase

```bash
# In your Supabase project (or via the MCP):
supabase db push                            # applies all three migration files
# OR run each in the SQL editor in order:
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_rls.sql
#   supabase/migrations/0003_seed.sql
```

After the migrations run, `0003_seed.sql` populates the reference
tables: 9 categories, 20 saints, 12 dioceses, 4 religious orders.
**Artist rows are NOT seeded** — Lovable should import them via the
admin console or the `src/data/artists.ts` file (suggested: write a
one-off `scripts/seed-artists.mjs` that calls the Supabase service-role
client).

Create a storage bucket called `wip-images` with policies allowing
authenticated artists to write to `artists/{artist_id}/...` and the
public to read.

## 2. Auth configuration

In Supabase → Authentication → Providers:

- **Email** — enable magic links. Disable email signups requiring a
  password.
- **Google** — enable OAuth for both patron and artist login.

In Authentication → URL configuration:

- Site URL: `https://locavit.com`
- Redirect URLs: `https://locavit.com/auth/callback`, `http://localhost:5173/auth/callback`

The `handle_new_user` trigger in `0001_init.sql` auto-creates a profile
row when someone signs up. Default role is `patron`. Operators are
flipped manually via SQL or the (future) admin console.

## 3. Wire up env vars

Copy `.env.example` to `.env.local` and fill in:

```
VITE_MAPBOX_TOKEN=pk.eyJ...        # Mapbox public token
VITE_MAPBOX_STYLE=mapbox://styles/<owner>/<style>
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...      # public anon key
```

Server-only secrets (set with `supabase secrets set`):

```
RESEND_API_KEY=re_...
RESEND_FROM="Locavit <hello@locavit.com>"
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
LOCAVIT_SITE=https://locavit.com
```

## 4. Deploy the edge functions

```bash
supabase functions deploy notify --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

`notify` is called by the app (or the service-role key) for every
state transition. `stripe-webhook` is called by Stripe; register the
endpoint in the Stripe Dashboard under Developers → Webhooks, pointed
at `https://<project>.supabase.co/functions/v1/stripe-webhook`. Enable
these events:

- `payment_intent.succeeded`
- `charge.dispute.created`
- `charge.dispute.closed`
- `transfer.created`
- `account.updated`

## 5. Swap localStorage → Supabase

The current prototype's `src/lib/store.ts` provides a React context with
methods like `createCommission`, `artistQuote`, `releaseMilestone`, etc.
Replace each method's body with the equivalent Supabase call, leaving
the API surface identical so the components don't change.

The recommended pattern (TanStack Query):

```ts
// src/lib/store-supabase.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "./supabase-client";

export function useCommissions() {
  return useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("commissions")
        .select("*, commission_escrow(*), commission_messages(*), commission_wip(*)");
      if (error) throw error;
      return data;
    },
  });
}

export function useArtistQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; total: number; note: string }) => {
      // (1) Update the commission row
      // (2) Insert three commission_escrow rows
      // (3) POST /functions/v1/notify with event=commission.quoted
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commissions"] }),
  });
}
```

The state transitions that today live inside `store.ts` `setState` blocks
become single transactions in a Supabase RPC (recommended) or
multi-statement edge function calls.

## 6. Stripe Connect (real payouts)

Replace `src/pages/Connect.tsx`'s mock with the real flow:

1. **Onboarding** — when an endorsed artist clicks "Set up payouts":
   - Server creates a Stripe Connect Express account
     (`stripe.accounts.create({ type: 'express' })`)
   - Server creates an account link
     (`stripe.accountLinks.create({ account, type: 'account_onboarding', refresh_url, return_url })`)
   - Browser redirects to the Stripe-hosted onboarding URL.
2. **Status sync** — the `account.updated` webhook (handled in
   `stripe-webhook`) keeps the `connect_accounts` row's `status` in
   sync.
3. **Funding a milestone** — when a patron funds the deposit, the
   server creates a `PaymentIntent` with `capture_method=manual` and
   `transfer_data.destination = artist.stripe_account_id`. We capture
   the charge on patron action, then release via `transfer.create` when
   the patron approves the milestone. The webhook flips
   `commission_escrow.status` from `unfunded` → `held` → `released`.

Each escrow row's `id` is stored in the PaymentIntent's `metadata` so
the webhook can find it.

## 7. Resend (real email)

Verify a sending domain at https://resend.com/domains (use
`locavit.com` or a subdomain like `mail.locavit.com`). Add the DNS
records Resend gives you (SPF, DKIM, DMARC) at your registrar.

When a state transition fires in the app, instead of `notify()` pushing
to the local outbox, POST the event to
`https://<project>.supabase.co/functions/v1/notify` with the
service-role bearer or an authenticated user token. The function
re-renders the email, suppresses unsubscribed recipients, sends via
Resend, and records the result in `public.outbox` for the admin
console.

The Deno-runtime version of the templates lives at
`supabase/functions/notify/templates.ts`. Keep it in sync with
`src/lib/email/templates.ts` — there's a TODO for a CI parity check.

## 8. Mapbox

The Map of the Body of Christ already runs against any Mapbox token.
Set `VITE_MAPBOX_TOKEN` and (optionally) `VITE_MAPBOX_STYLE`. Diocese
coordinates are seeded in `0003_seed.sql`; the map reads from
`public.dioceses`.

## 9. Hosting

The Vite build outputs a static `dist/` directory. Drop it on any host.
Recommended for Lovable's deployment: Vercel or Cloudflare Pages.
Sitemap is generated at build time into `dist/sitemap.xml`; robots is
in `public/robots.txt` and copies through.

For SEO: Google does execute JS so the per-route `<Seo>` meta works,
but link-preview bots (Slack, Twitter, LinkedIn) don't. Add
`vite-plugin-prerender` or move to Next.js if non-Google previews
matter for marketing.

## 10. Apply order summary

1. Supabase project provisioned + auth providers set
2. `0001_init.sql` → `0002_rls.sql` → `0003_seed.sql` run
3. `wip-images` storage bucket created
4. `.env.local` filled in (Mapbox + Supabase) + `supabase secrets` set
   (Resend + Stripe)
5. Edge functions deployed
6. Stripe webhook endpoint registered
7. Resend sending domain verified
8. Artists imported (one-shot script from `src/data/artists.ts`)
9. First operator promoted: `update profiles set role = 'operator' where email = 'you@locavit.com';`
10. `npm run build && npm run preview` to smoke-test
11. Deploy to Vercel / Cloudflare Pages

## Routes inventory

Public marketing:

- `/` — Landing
- `/browse` — Browse the guild (search + filters + compare + saved)
- `/map` — Map of the Body of Christ (Mapbox)
- `/ledger` — public commission ledger
- `/catalog` — annual catalog of delivered commissions
- `/orders` — religious-order collections
- `/partnerships` — B2B landing + open RFPs
- `/partnerships/new` — submit an institutional brief
- `/partnerships/:id` — RFP detail + proposals + approval chain
- `/manifesto` — the brand thesis
- `/journal` — Beauty Manifesto quarterly
- `/report` — Anti-Kitsch Report
- `/prize` — Pulchritudo Prize
- `/apprenticeships` — application form + grant program
- `/security` — risk + breach runbook
- `/about` — mission
- `/artists/:slug` — artist profile

Auth-gated:

- `/signup/artist` — artist application + endorsement flow
- `/dashboard` — artist & patron dashboard
- `/workspace/:id` — commission workspace
- `/commission/:slug` — start a commission with a specific artist
- `/checkout/:id` (future) — patron funds a milestone
- `/connect/:slug` — Stripe Connect onboarding
- `/certificate/:id` — provenance certificate (auth-gated for in-flight; public for delivered)
- `/preferences` — email preferences (signed-link only)
- `/compare` — side-by-side artist comparison
- `/verify/:token` — pastor endorsement (no auth; signed token)
- `/chancery/:token` — chancery confirmation (no auth; signed token)
- `/admin` — operator console (role-gated)
- `/outbox` — dev-only email outbox viewer (delete in prod or role-gate)

## Conventions worth preserving

1. **Voice.** The brand voice is the moat. Read `src/data/brand.ts`
   and `src/pages/Manifesto.tsx` before changing copy.
2. **Anti-kitsch.** Read `src/pages/Report.tsx` before commissioning
   any AI-generated imagery for marketing.
3. **The Ledger is the proof.** Every delivered commission appears
   there. Don't hide losses or anonymize artists.
4. **100% to the artist.** The artist quotes a price; the platform fee
   is added on top, paid by the patron. Never deduct from the artist.

## Where the prototype is honest about being a prototype

- Persona switcher on `/workspace` (toggle patron/artist view) —
  becomes auth-gated separation in production.
- "Prototype · no email is sent" footer copy on forms — remove once
  Resend is live.
- `/outbox` is a dev tool — gate behind operator role or delete.
- `seedReviews()` / `seedIntakes()` etc. — drop the seed-loaders from
  `src/lib/store.ts`'s `load()` once Supabase is in.
- The mock Stripe Connect at `src/pages/Connect.tsx` collects fake
  routing numbers — replace with Stripe-hosted onboarding URLs.

## Contact

Questions about the brand or the business logic: jeromy@locavit.com
(or whatever address ends up on file).
