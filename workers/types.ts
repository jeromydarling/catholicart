// Cloudflare Worker bindings for the catholicart app.

// Cloudflare Email Service `send_email` binding. The runtime injects
// this as `env.EMAIL` (declared in wrangler.jsonc); we call
// `env.EMAIL.send({ to, from, subject, html, text })` to dispatch.
export interface SendEmailBinding {
  send(message: {
    to: string | string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    reply_to?: string;
    cc?: string | string[];
    bcc?: string | string[];
  }): Promise<{ messageId: string }>;
}

export interface Env {
  // Static assets binding (the SPA)
  ASSETS: Fetcher;

  // D1 database
  DB: D1Database;

  // R2 bucket for WIP photos
  BUCKET: R2Bucket;

  // KV namespaces
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;

  // Workers AI
  AI: Ai;

  // Cloudflare Email Service (outbound transactional)
  EMAIL: SendEmailBinding;

  // Vars (set in wrangler.jsonc)
  SITE_URL: string;
  EMAIL_FROM: string;

  // Secrets (set via wrangler secret put)
  AUTH_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  // For the vocation-site synthesizer. When unset, the synthesize
  // endpoint returns a clear error; the questionnaire still works
  // and the artist can write their own sections by hand.
  ANTHROPIC_API_KEY?: string;

  // Payout rails — each artist picks one. Each adapter checks for
  // its own key at call time; missing keys queue the disbursement
  // rather than failing it.
  WISE_API_TOKEN?: string;          // Wise Business API
  WISE_PROFILE_ID?: string;         // Wise business profile that funds transfers
  CHECKBOOK_API_KEY?: string;       // Checkbook.io paper + digital checks
  CHECKBOOK_API_SECRET?: string;
  PAYPAL_CLIENT_ID?: string;        // PayPal Payouts API (OAuth2)
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_LIVE?: string;             // "true" for production; otherwise sandbox

  // Public-safe client config exposed via /api/config (these are
  // intentionally browser-bound — Mapbox pk.* tokens, Sentry DSNs,
  // etc. — so we serve them at runtime rather than baking into the
  // Vite bundle).
  VITE_MAPBOX_TOKEN?: string;
  VITE_MAPBOX_STYLE?: string;
  VITE_SENTRY_DSN?: string;
}

export type AppVariables = {
  // Set by auth middleware
  user?: {
    id: string;
    email: string;
    role: 'patron' | 'artist' | 'operator';
    display_name?: string;
  };
};
