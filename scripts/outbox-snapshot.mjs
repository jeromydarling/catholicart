// Drive a commission lifecycle in one browser session, then visit
// /outbox in the SAME session so localStorage is shared. Screenshot
// the index and the first few previews.

import puppeteer from "puppeteer-core";

const b = await puppeteer.launch({
  executablePath:
    "/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  args: ["--no-sandbox", "--ignore-certificate-errors"],
  headless: true,
});

const p = await b.newPage();
await p.setViewport({ width: 1400, height: 1000 });

async function settle(ms = 250) { await new Promise((r) => setTimeout(r, ms)); }
async function click(text, tag = "button") {
  return p.evaluate(({ text, tag }) => {
    const els = [...document.querySelectorAll(tag)];
    const t = els.find((b) => b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(text.toLowerCase()));
    if (!t) return false;
    t.click();
    return true;
  }, { text, tag });
}
async function fillByPlaceholder(frag, value) {
  return p.evaluate(({ frag, value }) => {
    const f = [...document.querySelectorAll("input, textarea")].find((f) => (f.placeholder || "").toLowerCase().includes(frag.toLowerCase()));
    if (!f) return false;
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(f), "value").set;
    setter.call(f, value);
    f.dispatchEvent(new Event("input", { bubbles: true }));
    f.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, { frag, value });
}
async function setPersona(role) {
  await p.evaluate((r) => {
    const t = [...document.querySelectorAll('[role="tab"]')].find((b) => b.textContent.trim().toLowerCase().startsWith(r));
    t?.click();
  }, role);
  await settle(200);
}

// 1. Fresh state
await p.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await p.evaluate(() => Object.keys(localStorage).forEach((k) => localStorage.removeItem(k)));
await p.reload({ waitUntil: "domcontentloaded" });
await settle(500);

// 2. Drive a commission through to delivered + blessed
await p.goto("http://localhost:5173/commission/annunciata-park", { waitUntil: "domcontentloaded" });
await settle(400);
await fillByPlaceholder("Mary Beauchamp", "Test Patron");
await fillByPlaceholder("artist's reply", "patron@example.com");
await fillByPlaceholder("saint", "An icon of Our Lady of Guadalupe, ~18x24in egg tempera with gilded halo, for our family oratory.");
await fillByPlaceholder("Where will the work live", "Family oratory, Pittsburgh PA");
await click("Send to");
await settle(1200);

await setPersona("artist");
await fillByPlaceholder("e.g. 1500", "2400");
await fillByPlaceholder("Materials, dimensions", "Egg tempera on poplar, 23kt gold leaf. Six weeks. $2,400.");
await click("Send quote");
await settle(500);

await setPersona("patron");
await click("Fund deposit");
await settle(300);
await click("Confirm — fund");
await settle(500);

await setPersona("artist");
await fillByPlaceholder("Underdrawing complete", "Poplar panel gessoed and sanded smooth");
await click("Post update");
await settle(400);
await fillByPlaceholder("Show what's done", "Underdrawing complete. Halo gilded. Beginning the face.");
await click("Mark midpoint");
await settle(500);

await setPersona("patron");
await click("Release midpoint");
await settle(500);

await setPersona("artist");
await fillByPlaceholder("varnish", "Finished. Final varnish coat. Packed for shipment.");
await click("Mark complete");
await settle(500);

await setPersona("patron");
await click("Release & receive");
await settle(500);

await fillByPlaceholder("Fr. James Aldworth", "Fr. Augustine Brooks");
await fillByPlaceholder("St. Cecilia's", "Family Oratory, Pittsburgh PA");
await click("Record blessing");
await settle(500);

// 3. Outbox
await p.goto("http://localhost:5173/outbox", { waitUntil: "domcontentloaded" });
await settle(800);
await p.screenshot({ path: "/tmp/walkthrough/outbox-index.png", fullPage: false });
console.log("✓ outbox-index");

// Click each entry and screenshot the preview (first 5 distinct events)
const subjects = await p.$$eval("aside button", (btns) =>
  btns.map((b) => b.textContent.replace(/\s+/g, " ").trim().slice(0, 60)),
);
console.log(`Found ${subjects.length} outbox entries`);
for (let i = 0; i < Math.min(subjects.length, 5); i++) {
  const buttons = await p.$$("aside button");
  await buttons[i]?.click();
  await settle(400);
  await p.screenshot({ path: `/tmp/walkthrough/outbox-${String(i + 1).padStart(2, "0")}.png`, fullPage: false });
  console.log(`✓ outbox-${i + 1} (${subjects[i]})`);
}

// Preferences page
await p.goto("http://localhost:5173/preferences?email=patron@example.com", { waitUntil: "domcontentloaded" });
await settle(500);
await p.screenshot({ path: "/tmp/walkthrough/preferences.png", fullPage: false });
console.log("✓ preferences");

await b.close();
