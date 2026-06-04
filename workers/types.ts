// Cloudflare Worker bindings for the catholicart app.

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

  // Vars (set in wrangler.jsonc)
  SITE_URL: string;
  EMAIL_FROM: string;

  // Secrets (set via wrangler secret put)
  AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
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
