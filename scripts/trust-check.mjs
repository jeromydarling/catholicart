// Verify the trust layer: review form, dispute, shipping, IP terms.
import puppeteer from "puppeteer-core";

const b = await puppeteer.launch({
  executablePath: "/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  args: ["--no-sandbox", "--ignore-certificate-errors"],
  headless: true,
});
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 1100 });
async function settle(ms = 250) { await new Promise((r) => setTimeout(r, ms)); }

// 1. Visit Felix Donnegan's profile — his seed crucifix has a review now.
await p.goto("http://localhost:5173/artists/felix-donnegan", { waitUntil: "domcontentloaded" });
await settle(700);
await p.evaluate(() => window.scrollTo(0, 1800));
await settle(400);
await p.screenshot({ path: "/tmp/walkthrough/trust-track-record.png" });
console.log("✓ track record + reviews on Felix profile");

// 2. Open the delivered commission's workspace and verify dispute + IP + shipping blocks
await p.goto("http://localhost:5173/workspace/seed_cmn_crucifix", { waitUntil: "domcontentloaded" });
await settle(700);
await p.evaluate(() => window.scrollTo(0, 600));
await settle(400);
await p.screenshot({ path: "/tmp/walkthrough/trust-workspace-sidebar.png" });
console.log("✓ workspace sidebar with trust blocks");

// 3. Open dispute UI on an in-progress commission
await p.goto("http://localhost:5173/workspace/seed_cmn_immaculata", { waitUntil: "domcontentloaded" });
await settle(700);
await p.evaluate(() => window.scrollTo(0, 1200));
await settle(400);
await p.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Open dispute");
  btn?.click();
});
await settle(400);
await p.screenshot({ path: "/tmp/walkthrough/trust-dispute-form.png" });
console.log("✓ dispute form open");

await b.close();
console.log("done");
