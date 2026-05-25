// Captures every page section that uses ink-on-dark, plus the four
// forms with new success states, so we can visually verify contrast
// and form polish.

import puppeteer from "puppeteer-core";
import { mkdir } from "fs/promises";

const OUT = "/tmp/contrast";
await mkdir(OUT, { recursive: true });

const b = await puppeteer.launch({
  executablePath:
    "/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  args: ["--no-sandbox", "--ignore-certificate-errors"],
  headless: true,
});

async function shot(name, route, scroll = 0, viewport = { width: 1280, height: 900 }) {
  const p = await b.newPage();
  await p.setViewport(viewport);
  await p.goto(`http://localhost:5173${route}`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 700));
  if (scroll) {
    await p.evaluate((y) => window.scrollTo(0, y), scroll);
    await new Promise((r) => setTimeout(r, 250));
  }
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`✓ ${name}`);
  await p.close();
}

// Dark sections
await shot("landing-hero", "/", 0);
await shot("report-by-contrast", "/report", 2600);
await shot("apprenticeships-apply", "/apprenticeships", 2400);
await shot("prize-past-laureates", "/prize", 1100);

// Same on mobile
await shot("landing-hero-m", "/", 0, { width: 375, height: 740, isMobile: true });
await shot("report-by-contrast-m", "/report", 4400, { width: 375, height: 740, isMobile: true });
await shot("apprenticeships-apply-m", "/apprenticeships", 4400, { width: 375, height: 740, isMobile: true });
await shot("prize-past-laureates-m", "/prize", 1800, { width: 375, height: 740, isMobile: true });

// Form success states — simulate by filling and submitting
async function submitForm(name, route, submitText, fill) {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(`http://localhost:5173${route}`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 500));
  await fill(p);
  await new Promise((r) => setTimeout(r, 300));
  // Click the submit button by visible text — that's how React forms fire.
  const clicked = await p.evaluate((text) => {
    const btns = [...document.querySelectorAll("button[type='submit'], button")];
    const target = btns.find((b) =>
      b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(text.toLowerCase()),
    );
    if (!target) return false;
    target.scrollIntoView({ block: "center" });
    target.click();
    return true;
  }, submitText);
  if (!clicked) console.log(`   (! submit button "${submitText}" not found)`);
  await new Promise((r) => setTimeout(r, 700));
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`✓ ${name}`);
  await p.close();
}

await submitForm("journal-subscribed", "/journal", "Subscribe", async (p) => {
  await p.evaluate(() => {
    const i = document.querySelector('input[type="email"]');
    if (i) {
      const setter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(i),
        "value",
      ).set;
      setter.call(i, "patron@example.org");
      i.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
});

await submitForm("prize-nominated", "/prize", "Send nomination", async (p) => {
  await p.evaluate(() => {
    const fields = {
      name: "Mary Beauchamp",
      email: "mary@stmichaels.org",
      work: "Processional Crucifix in Cherry",
      reason: "It made the parish quiet on the first Sunday of Lent.",
    };
    for (const [n, v] of Object.entries(fields)) {
      const i = document.querySelector(`[name="${n}"]`);
      if (i) {
        const setter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(i),
          "value",
        ).set;
        setter.call(i, v);
        i.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });
});

await b.close();
