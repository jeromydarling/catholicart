// Verify <Seo> renders per-route head tags + JSON-LD.

import puppeteer from "puppeteer-core";

const b = await puppeteer.launch({
  executablePath: "/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  args: ["--no-sandbox", "--ignore-certificate-errors"],
  headless: true,
});
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });

const ROUTES = [
  "/",
  "/browse",
  "/ledger",
  "/catalog",
  "/artists/annunciata-park",
  "/certificate/seed_cmn_crucifix",
  "/journal",
  "/report",
  "/prize",
  "/apprenticeships",
  "/partnerships",
];

let allOk = true;
for (const route of ROUTES) {
  await p.goto(`http://localhost:5173${route}`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 500));
  const data = await p.evaluate(() => {
    const title = document.title;
    // Helmet inserts data-react-helmet="true"; static tags don't have it
    const allDescs = [...document.querySelectorAll('meta[name="description"]')];
    const helmetDesc = allDescs.find((m) => m.hasAttribute("data-rh"));
    const description = (helmetDesc ?? allDescs[allDescs.length - 1])?.getAttribute("content") || "";
    const og = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent);
    return { title, description, og, canonical, jsonLdCount: jsonLd.length, descCount: allDescs.length };
  });
  const ok = data.title.includes("Locavit") && data.description.length > 30;
  if (!ok) allOk = false;
  console.log(
    `${ok ? "✓" : "✗"} ${route}\n    title: ${data.title.slice(0, 80)}\n    desc:  ${data.description.slice(0, 80)}…\n    canonical: ${data.canonical}\n    og:title: ${data.og.slice(0, 60)}\n    json-ld: ${data.jsonLdCount} · desc-tags: ${data.descCount}`,
  );
}

await b.close();
process.exit(allOk ? 0 : 1);
