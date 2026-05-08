import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// On GitHub Pages this is served at https://<user>.github.io/catholicart/,
// so production builds need a base path. Local dev stays at "/".
const base = process.env.GITHUB_PAGES === "true" ? "/catholicart/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
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
