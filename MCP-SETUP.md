# MCP setup for Ars Sacra

Five MCP servers power the production buildout: **Supabase**, **Stripe**,
**Resend**, **PostHog**, and **Cloudflare**. Four are configured via the
project-scoped `.mcp.json` in this repo. PostHog is installed via its
own wizard.

`.mcp.json` is gitignored. The committed template is `.mcp.json.example`.

## 1 — paste your keys into `.mcp.json`

Open `.mcp.json` and replace the four placeholders.

### Supabase — `SUPABASE_ACCESS_TOKEN`

A **Personal Access Token** scoped to your account. The MCP can then list,
create, and run SQL against any of your projects.

1. Go to **https://supabase.com/dashboard/account/tokens**
2. *Generate new token* → name it "Claude Code · catholicart"
3. Copy the `sbp_...` token into `SUPABASE_ACCESS_TOKEN`.

*Optional later:* once you have a project, add `--project-ref <ref>` to
the `args` array so the MCP can only touch that one project. Find the
project ref in your Supabase dashboard URL (`.../project/<ref>`).

### Stripe — `STRIPE_SECRET_KEY`

A **test-mode secret key** for now. We'll swap to live before launch.

1. Go to **https://dashboard.stripe.com/test/apikeys**
2. Reveal the *Secret key* — starts with `sk_test_`
3. Copy into `STRIPE_SECRET_KEY`.

### Resend — `RESEND_API_KEY`

1. Go to **https://resend.com/api-keys**
2. *Create API key* — scope to "Sending access only"
3. Copy the `re_...` key into `RESEND_API_KEY`.
4. Verify a sending domain at **https://resend.com/domains** (we'll use
   it for pastor-endorsement magic links + patron milestone emails).

### Cloudflare — no key needed up front

The Cloudflare entry uses the hosted SSE endpoint at
`mcp.cloudflare.com/sse`. The first time the new Claude Code session
calls a Cloudflare tool, it'll pop a browser tab asking you to
authorize against your Cloudflare account. OAuth handles the rest;
no token to paste into `.mcp.json`.

If you'd rather pin an API token (no browser hand-off), swap the
entry to:

```json
"cloudflare": {
  "command": "npx",
  "args": ["-y", "@cloudflare/mcp-server-cloudflare"],
  "env": {
    "CLOUDFLARE_API_TOKEN": "<scoped-token>",
    "CLOUDFLARE_ACCOUNT_ID": "<account-id>"
  }
}
```

Scope the token at https://dash.cloudflare.com/profile/api-tokens with
`Account: Pages:Edit`, `Account: Workers Scripts:Edit`, `Account:
Workers KV Storage:Edit`, and `Zone: DNS:Edit` for the forma domain.

## 2 — install PostHog separately

PostHog auto-installs through its wizard, which handles browser-based
OAuth. Run from the project directory:

```bash
npx @posthog/wizard@latest mcp add
```

It'll authenticate you in the browser and add the MCP to your Claude
Code config. It writes user-scoped (not project-scoped) — which is fine,
analytics aren't project-specific.

## 3 — restart Claude Code

MCPs are loaded at session start. Quit and relaunch `claude` from the
catholicart directory. Verify with:

```bash
claude mcp list
```

You should see `supabase`, `stripe`, `resend`, and (after the wizard)
`posthog` listed.

## Next steps after MCPs are live

1. **Create Supabase project** via the MCP — I'll use the Supabase MCP
   to provision one and run the initial migration.
2. **Configure Stripe Connect** in the Stripe Dashboard — turn on
   Express accounts, set the platform name to "Ars Sacra".
3. **Verify Resend sending domain** — pick a real domain (e.g.
   `arssacra.com`) and add the DNS records.
4. **PostHog project key** — once the MCP is connected I'll pull the
   project key and wire `posthog-js` into `main.tsx`.

After that, the localStorage `StoreProvider` gets swapped for a Supabase
client, the mock Stripe Connect flow becomes real Express onboarding,
and the verification flow sends actual emails. That's the Lovable
handoff.
