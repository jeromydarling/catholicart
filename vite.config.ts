import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "node:path";

// Cloudflare Workers + Vite. The cloudflare() plugin wires the SPA's
// static assets to the Worker defined in wrangler.jsonc, and provides
// bindings (D1, R2, KV, AI, etc.) inside the dev server.
//
// Legacy GitHub Pages base-path support is preserved for any old
// preview builds, but production now ships via Cloudflare Workers.

const base = process.env.GITHUB_PAGES === "true" ? "/catholicart/" : "/";

export default defineConfig({
  base,
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
