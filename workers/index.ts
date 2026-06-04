// Cloudflare Worker entry point.
//
// During this transition, the Worker's only job is to serve the SPA's
// static assets via the ASSETS binding. SPA-style routing (with
// not_found_handling = "single-page-application") means any path that
// isn't a real asset falls back to index.html so React Router can
// handle it.
//
// Phase 2 will add /api/* routes here (Hono router) once D1 + auth are
// wired. For now, anything not matched by /api/ goes to the SPA.

interface Env {
  ASSETS: Fetcher;
  // DB?: D1Database;
  // BUCKET?: R2Bucket;
  // AI?: Ai;
  // CACHE?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Future: /api/* → Workers API routes
    if (url.pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "API not yet implemented",
          path: url.pathname,
        }),
        {
          status: 501,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Everything else: static assets / SPA fallback
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
