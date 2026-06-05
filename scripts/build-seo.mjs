// Build-time sitemap.xml generator. Runs after `vite build`.

import { writeFile, readFile } from "fs/promises";
import { resolve } from "path";

const SITE =
  process.env.ARS_SACRA_SITE ??
  process.env.VITE_SITE_URL ??
  "https://catholicart.jer-f84.workers.dev";
// Cloudflare Vite plugin places client assets in dist/client/. Fall
// back to dist/ for any legacy non-Workers build.
import { existsSync } from "fs";
const OUT = existsSync(resolve("dist/client"))
  ? resolve("dist/client/sitemap.xml")
  : resolve("dist/sitemap.xml");

const artistsFile = await readFile(resolve("src/data/artists.ts"), "utf8");
const slugMatches = [...artistsFile.matchAll(/slug:\s*"([^"]+)"/g)];
const artistSlugs = slugMatches.map((m) => m[1]);

const staticRoutes = [
  "/",
  "/browse",
  "/map",
  "/ledger",
  "/catalog",
  "/orders",
  "/partnerships",
  "/manifesto",
  "/about",
  "/journal",
  "/report",
  "/prize",
  "/apprenticeships",
  "/security",
  "/signup/artist",
  "/features",
  "/demo",
  "/library",
  "/letters",
  "/dioceses",
];

const now = new Date().toISOString();
const urls = [
  ...staticRoutes.map((r) => ({
    loc: SITE + r,
    lastmod: now,
    priority: r === "/" ? "1.0" : "0.8",
  })),
  ...artistSlugs.map((s) => ({
    loc: `${SITE}/artists/${s}`,
    lastmod: now,
    priority: "0.7",
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

await writeFile(OUT, xml);
console.log(`✓ sitemap.xml — ${urls.length} URLs → ${OUT}`);
