// Verifies the discovery layer: search, sort, save, compare, similar.

import puppeteer from "puppeteer-core";

const b = await puppeteer.launch({
  executablePath:
    "/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  args: ["--no-sandbox", "--ignore-certificate-errors"],
  headless: true,
});
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 1000 });
async function settle(ms = 250) { await new Promise((r) => setTimeout(r, ms)); }

const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("Failed to load") && !m.text().includes("ERR_CERT") && !m.text().includes("@emotion") && !m.text().includes("1code") && !m.text().includes("Mapbox"))
    errors.push(`console.error: ${m.text()}`);
});

// 1. Search
await p.goto("http://localhost:5173/browse?q=guadalupe", { waitUntil: "domcontentloaded" });
await settle(500);
await p.screenshot({ path: "/tmp/walkthrough/discovery-search.png" });
const cards = await p.$$eval("h3,h4,.font-display", (els) =>
  els.map((e) => e.textContent.trim()).filter(Boolean).slice(0, 12),
);
console.log("✓ search guadalupe → result cards:", cards.slice(0, 5).join(" | "));

// 2. Sort
await p.goto("http://localhost:5173/browse?sort=price-asc", { waitUntil: "domcontentloaded" });
await settle(500);
await p.screenshot({ path: "/tmp/walkthrough/discovery-sort-asc.png" });
console.log("✓ sort price-asc");

// 3. Heart + compare
await p.goto("http://localhost:5173/browse", { waitUntil: "domcontentloaded" });
await settle(500);
const hearts = await p.$$("button[aria-label^='Save']");
console.log(`  found ${hearts.length} save buttons`);
if (hearts[0]) await hearts[0].click();
if (hearts[1]) await hearts[1].click();
await settle(200);
const scales = await p.$$("button[aria-label^='Add'][aria-label*='compare']");
console.log(`  found ${scales.length} compare buttons`);
if (scales[0]) await scales[0].click();
if (scales[2]) await scales[2].click();
if (scales[3]) await scales[3].click();
await settle(400);
await p.screenshot({ path: "/tmp/walkthrough/discovery-with-compare.png" });
console.log("✓ saved + compare selected");

// 4. Compare page
const compareBtn = await p.evaluate(() => {
  const a = [...document.querySelectorAll("a")].find((a) => a.textContent.toLowerCase().includes("side-by-side"));
  return a?.getAttribute("href") ?? null;
});
console.log("  compare URL:", compareBtn);
if (compareBtn) {
  await p.goto(`http://localhost:5173${compareBtn}`, { waitUntil: "domcontentloaded" });
  await settle(600);
  await p.screenshot({ path: "/tmp/walkthrough/discovery-compare.png" });
  console.log("✓ compare page");
}

// 5. Saved chip
await p.goto("http://localhost:5173/browse?saved=true", { waitUntil: "domcontentloaded" });
await settle(500);
await p.screenshot({ path: "/tmp/walkthrough/discovery-saved-only.png" });
console.log("✓ saved-only");

// 6. Similar artists on profile
await p.goto("http://localhost:5173/artists/annunciata-park", { waitUntil: "domcontentloaded" });
await settle(500);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await settle(400);
await p.screenshot({ path: "/tmp/walkthrough/discovery-similar.png", fullPage: false });
console.log("✓ similar-artists rendered");

await b.close();
if (errors.length) {
  console.log("\n--- ERRORS ---");
  errors.forEach((e) => console.log(e));
  process.exit(1);
}
console.log("\nClean.");
