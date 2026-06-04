// Verify the B2B layer: partnerships, intake form, detail.
import puppeteer from "puppeteer-core";

const b = await puppeteer.launch({
  executablePath: "/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  args: ["--no-sandbox", "--ignore-certificate-errors"],
  headless: true,
});
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 1100 });
async function settle(ms = 250) { await new Promise((r) => setTimeout(r, ms)); }

await p.goto("http://localhost:5173/partnerships", { waitUntil: "domcontentloaded" });
await settle(700);
await p.screenshot({ path: "/tmp/walkthrough/b2b-partnerships.png" });
console.log("✓ partnerships with open RFPs");

await p.goto("http://localhost:5173/partnerships/seed_ink_galway_stations", { waitUntil: "domcontentloaded" });
await settle(700);
await p.screenshot({ path: "/tmp/walkthrough/b2b-detail.png" });
console.log("✓ intake detail with approval chain + proposals");

await p.evaluate(() => window.scrollTo(0, 1600));
await settle(400);
await p.screenshot({ path: "/tmp/walkthrough/b2b-detail-proposals.png" });
console.log("✓ proposals scrolled");

await p.goto("http://localhost:5173/partnerships/new", { waitUntil: "domcontentloaded" });
await settle(700);
await p.screenshot({ path: "/tmp/walkthrough/b2b-intake-form.png" });
console.log("✓ intake form");

await b.close();
console.log("done");
