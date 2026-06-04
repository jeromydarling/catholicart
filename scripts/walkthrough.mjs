// Lifecycle walkthrough: drives a fresh commission from scoping all
// the way to blessed, switching persona at each step, screenshotting
// every transition. Reports back on anything broken.

import puppeteer from "puppeteer-core";
import { mkdir } from "fs/promises";

const BASE = "http://localhost:5173";
const OUT = "/tmp/walkthrough";
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath:
    "/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  args: ["--no-sandbox", "--ignore-certificate-errors"],
  headless: true,
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 1000 });

const allErrors = [];
page.on("pageerror", (e) => allErrors.push({ kind: "pageerror", msg: e.message }));
page.on("console", (msg) => {
  if (msg.type() === "error") {
    const t = msg.text();
    if (
      t.includes("Failed to load resource") ||
      t.includes("net::ERR_CERT") ||
      t.includes("@emotion/is-prop-valid") ||
      t.includes("tools/1code") ||
      t.includes("Mapbox")
    ) return;
    allErrors.push({ kind: "console.error", msg: t });
  }
});

let step = 0;
async function snap(name, sel) {
  step++;
  const file = `${OUT}/${String(step).padStart(2, "0")}-${name}.png`;
  if (sel) {
    const el = await page.$(sel);
    if (el) {
      await el.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file, fullPage: false });
    }
  } else {
    await page.screenshot({ path: file, fullPage: false });
  }
  return file;
}

async function settle(ms = 300) {
  await new Promise((r) => setTimeout(r, ms));
}

// Switch perspective in the workspace persona-toggle.
async function setPersona(role) {
  await page.evaluate((r) => {
    const btns = [...document.querySelectorAll('[role="tab"]')];
    const target = btns.find((b) => b.textContent.trim().toLowerCase().startsWith(r));
    target?.click();
  }, role);
  await settle(200);
}

// Click a button by visible text (case-insensitive contains).
async function clickByText(text, { tag = "button" } = {}) {
  return page.evaluate(
    ({ text, tag }) => {
      const els = [...document.querySelectorAll(tag)];
      const target = els.find((b) =>
        b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(text.toLowerCase()),
      );
      if (!target) return false;
      target.click();
      return true;
    },
    { text, tag },
  );
}

// Type into a textarea/input matched by placeholder or id.
async function fillByPlaceholder(placeholderFragment, value) {
  const ok = await page.evaluate(
    ({ frag, value }) => {
      const fields = [
        ...document.querySelectorAll("input, textarea"),
      ];
      const target = fields.find((f) =>
        (f.placeholder || "").toLowerCase().includes(frag.toLowerCase()),
      );
      if (!target) return false;
      const proto = Object.getPrototypeOf(target);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      desc.set.call(target, value);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
    { frag: placeholderFragment, value },
  );
  return ok;
}

const findings = [];
function note(label, detail) {
  findings.push({ step, label, detail });
  console.log(`  ⚠ ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("=== Lifecycle walkthrough ===\n");

// ── 0. Open the app and wipe state ───────────────────────────
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  Object.keys(localStorage).forEach((k) => localStorage.removeItem(k));
});
await page.reload({ waitUntil: "domcontentloaded" });
await settle(500);
console.log("Step 1: Landing page (fresh state)");
await snap("landing");

// ── 1. Browse the guild ─────────────────────────────────────
console.log("Step 2: Browse the guild");
await page.goto(`${BASE}/browse`, { waitUntil: "domcontentloaded" });
await settle(500);
await snap("browse");

// ── 2. Pick an artist and begin a commission ─────────────────
const artistSlug = "annunciata-park";
console.log(`Step 3: Artist profile (${artistSlug})`);
await page.goto(`${BASE}/artists/${artistSlug}`, { waitUntil: "domcontentloaded" });
await settle(500);
await snap("artist-profile");

console.log("Step 4: Open commission form");
await page.goto(`${BASE}/commission/${artistSlug}`, { waitUntil: "domcontentloaded" });
await settle(400);
await snap("commission-scope-form-empty");

// Fill the scope form
console.log("Step 5: Fill the scope form");
const filled = {
  name: await fillByPlaceholder("Mary Beauchamp", "Test Patron"),
  email: await fillByPlaceholder("artist's reply", "patron@example.com"),
  description: await fillByPlaceholder("saint", "An icon of St. Joseph the Worker, ~16x20in egg tempera with gilded halo. For our family oratory."),
  parish: await fillByPlaceholder("Where will the work live", "Family oratory · Cleveland OH"),
};
if (!filled.name) note("name field not found");
if (!filled.email) note("email field not found");
if (!filled.description) note("description field not found");
if (!filled.parish) note("parishOrChapel field not found");

await snap("commission-scope-form-filled");

// Submit form → workspace
console.log("Step 6: Submit scope form");
const submitted = await clickByText("Send to");
if (!submitted) note("submit button 'Send to ...' not found");
await settle(1200);

const url1 = page.url();
console.log(`   → ${url1}`);
if (!url1.includes("/workspace/")) {
  note("did not navigate to /workspace/:id after submit", url1);
}
await snap("workspace-after-create");

// ── 3. As artist, send a quote ─────────────────────────────
console.log("Step 7: Switch to Artist persona");
await setPersona("artist");
await snap("workspace-as-artist-scoping");

console.log("Step 8: Send a quote");
const quoteOk = await fillByPlaceholder("e.g. 1500", "1800");
if (!quoteOk) note("quote-usd input not found");
const quoteNoteOk = await fillByPlaceholder("Materials, dimensions", "Egg tempera on poplar, 23kt gold leaf for halo. Six weeks of work. $1,800.");
if (!quoteNoteOk) note("quote-note textarea not found");
await settle(300);
await snap("workspace-quote-preview");

const sentQuote = await clickByText("Send quote");
if (!sentQuote) note("'Send quote' button not found");
await settle(700);
await snap("workspace-after-quote");

// ── 4. As patron, fund the deposit ─────────────────────────
console.log("Step 9: Switch to Patron, fund deposit");
await setPersona("patron");
await settle(200);
await snap("workspace-awaiting-deposit");

const fundClicked = await clickByText("Fund deposit");
if (!fundClicked) note("'Fund deposit' button not found");
await settle(300);
await snap("workspace-fund-confirm");

const confirmFund = await clickByText("Confirm — fund");
if (!confirmFund) note("'Confirm — fund' button not found");
await settle(700);
await snap("workspace-after-deposit");

// ── 5. As artist, post WIP + mark midpoint ─────────────────
console.log("Step 10: Switch to Artist, post WIP");
await setPersona("artist");
await settle(200);

const wipFilled = await fillByPlaceholder("Underdrawing complete", "Poplar panel gessoed and sanded smooth");
if (!wipFilled) note("WIP caption input not found");
const wipPosted = await clickByText("Post update");
if (!wipPosted) note("'Post update' button not found");
await settle(500);
await snap("workspace-after-wip");

console.log("Step 11: Mark midpoint");
const midpointFilled = await fillByPlaceholder("Show what's done", "Underdrawing complete. Halo gilded. Beginning the face — please review.");
if (!midpointFilled) note("midpoint textarea not found");
const midpointMarked = await clickByText("Mark midpoint");
if (!midpointMarked) note("'Mark midpoint' button not found");
await settle(700);
await snap("workspace-midpoint-review");

// ── 6. As patron, release midpoint ─────────────────────────
console.log("Step 12: Switch to Patron, release midpoint");
await setPersona("patron");
await settle(200);
await snap("workspace-as-patron-midpoint-review");
const releasedMid = await clickByText("Release midpoint");
if (!releasedMid) note("'Release midpoint' button not found");
await settle(700);
await snap("workspace-after-midpoint-release");

// ── 7. As artist, mark complete ─────────────────────────────
console.log("Step 13: Switch to Artist, mark complete");
await setPersona("artist");
await settle(200);
await snap("workspace-artist-after-midpoint");

const finalFilled = await fillByPlaceholder("varnish", "Finished. Final varnish coat applied. Packed for delivery in cedar crate.");
if (!finalFilled) {
  // Try alternative placeholder fragment
  const alt = await fillByPlaceholder("finishing", "Finished. Final varnish coat applied. Packed for delivery.");
  if (!alt) note("final-mark textarea not found");
}
const markedComplete = await clickByText("Mark complete");
if (!markedComplete) note("'Mark complete' button not found");
await settle(700);
await snap("workspace-final-review");

// ── 8. As patron, release final + receive certificate ─────
console.log("Step 14: Switch to Patron, release final");
await setPersona("patron");
await settle(200);
await snap("workspace-patron-final-review");
const releasedFinal = await clickByText("Release & receive");
if (!releasedFinal) note("'Release & receive' button not found");
await settle(700);
await snap("workspace-after-final-delivered");

// ── 9. Record blessing ─────────────────────────────────────
console.log("Step 15: Record blessing");
const blessByOk = await fillByPlaceholder("Fr. James Aldworth", "Fr. Augustine Brooks");
if (!blessByOk) note("'Blessed by' input not found");
const blessAtOk = await fillByPlaceholder("St. Cecilia's", "Family Oratory · Cleveland OH");
if (!blessAtOk) note("'Parish or chapel' input not found");
const blessRecorded = await clickByText("Record blessing");
if (!blessRecorded) note("'Record blessing' button not found");
await settle(700);
await snap("workspace-blessed");

// ── 10. Certificate ─────────────────────────────────────────
console.log("Step 16: View certificate");
const certClicked = await clickByText("View provenance certificate", { tag: "a" });
if (!certClicked) {
  // Try other link text
  const alt = await clickByText("Certificate", { tag: "a" });
  if (!alt) note("certificate link not found");
}
await settle(900);
const certUrl = page.url();
if (!certUrl.includes("/certificate/")) {
  note("did not land on /certificate/:id", certUrl);
}
await snap("certificate");

// ── 11. Verify ledger updated ─────────────────────────────
console.log("Step 17: Visit ledger");
await page.goto(`${BASE}/ledger`, { waitUntil: "domcontentloaded" });
await settle(500);
await snap("ledger-after-walkthrough");

// ── 12. Visit catalog ─────────────────────────────────────
console.log("Step 18: Visit catalog");
await page.goto(`${BASE}/catalog`, { waitUntil: "domcontentloaded" });
await settle(500);
await snap("catalog-after-walkthrough");

// ── 13. Dashboard ─────────────────────────────────────────
console.log("Step 19: Visit dashboard");
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
await settle(500);
await snap("dashboard-after-walkthrough");

await browser.close();

// ── Report ─────────────────────────────────────────────────
console.log("\n\n=== Walkthrough finished ===");
console.log(`Steps:  ${step}`);
console.log(`Bugs:   ${findings.length}`);
console.log(`JS errors: ${allErrors.length}`);

if (findings.length) {
  console.log("\n--- Findings ---");
  for (const f of findings) {
    console.log(`  step ${f.step}: ${f.label}${f.detail ? ` — ${f.detail}` : ""}`);
  }
}
if (allErrors.length) {
  console.log("\n--- JS errors ---");
  for (const e of allErrors) {
    console.log(`  [${e.kind}] ${e.msg}`);
  }
}
process.exit(findings.length || allErrors.length ? 1 : 0);
