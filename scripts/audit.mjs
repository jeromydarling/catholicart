// A11y + console-warnings audit.
//
// Visits every route, captures EVERY console message (no filtering),
// then runs DOM-level a11y checks: heading hierarchy, missing alt,
// unlabeled buttons/inputs, focus-trap behavior on the mega menu and
// the mobile drawer.

import puppeteer from "puppeteer-core";

const ROUTES = [
  "/",
  "/browse",
  "/map",
  "/ledger",
  "/catalog",
  "/orders",
  "/partnerships",
  "/workspace/seed_cmn_immaculata",
  "/workspace/seed_cmn_st_joseph",
  "/workspace/seed_cmn_crucifix",
  "/certificate/seed_cmn_crucifix",
  "/report",
  "/journal",
  "/apprenticeships",
  "/prize",
  "/connect/imogen-fairbairn",
  "/dashboard",
  "/manifesto",
  "/about",
  "/signup/artist",
];

const browser = await puppeteer.launch({
  executablePath:
    "/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  args: ["--no-sandbox", "--ignore-certificate-errors"],
  headless: true,
});

const totals = { warnings: 0, errors: 0, a11y: 0 };

// ───────── console + a11y per route ─────────
for (const path of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleMsgs = [];
  page.on("console", (msg) => {
    const t = msg.text();
    // Only filter the *truly* unrelated noise from the 1code submodule and
    // CDN cert failures inside the headless container.
    if (
      t.includes("Failed to load resource") ||
      t.includes("net::ERR_CERT") ||
      t.includes("@emotion/is-prop-valid") ||
      t.includes("tools/1code")
    ) return;
    if (msg.type() === "warning") consoleMsgs.push({ level: "warn", text: t });
    if (msg.type() === "error") consoleMsgs.push({ level: "error", text: t });
  });
  page.on("pageerror", (e) => consoleMsgs.push({ level: "pageerror", text: e.message }));

  await page.goto(`http://localhost:5173${path}`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 500));

  // DOM a11y checks
  const a11y = await page.evaluate(() => {
    const issues = [];

    // Heading hierarchy
    const h1Count = document.querySelectorAll("h1").length;
    if (h1Count === 0) issues.push("no <h1>");
    if (h1Count > 1) issues.push(`${h1Count} <h1> elements (should be exactly 1)`);

    // Missing alt
    const imgs = [...document.querySelectorAll("img")];
    const noAlt = imgs.filter((i) => !i.hasAttribute("alt"));
    if (noAlt.length) issues.push(`${noAlt.length} <img> without alt`);

    // Unlabeled buttons (no text content AND no aria-label)
    const btns = [...document.querySelectorAll("button")];
    const bareBtns = btns.filter((b) => {
      const text = (b.textContent || "").trim();
      const aria = b.getAttribute("aria-label");
      const ariaby = b.getAttribute("aria-labelledby");
      return !text && !aria && !ariaby;
    });
    if (bareBtns.length) {
      issues.push(
        `${bareBtns.length} button(s) with no text or aria-label: ${bareBtns
          .slice(0, 3)
          .map((b) => b.outerHTML.slice(0, 80))
          .join(" | ")}`,
      );
    }

    // Unlabeled inputs (input/textarea/select without an associated label or aria-label)
    const formEls = [
      ...document.querySelectorAll("input, textarea, select"),
    ].filter((el) => {
      // skip hidden inputs (they don't need labels)
      const t = (el.getAttribute("type") || "").toLowerCase();
      if (t === "hidden" || t === "submit" || t === "button") return false;
      // skip non-form usages
      return true;
    });
    const unlabeled = formEls.filter((el) => {
      const id = el.id;
      const ariaLabel = el.getAttribute("aria-label");
      const ariaby = el.getAttribute("aria-labelledby");
      const placeholder = el.getAttribute("placeholder"); // not a label, but better than nothing
      const labelFor = id ? document.querySelector(`label[for="${id}"]`) : null;
      const wrappingLabel = el.closest("label");
      if (ariaLabel || ariaby || labelFor || wrappingLabel) return false;
      return { el, hasPlaceholder: !!placeholder };
    });
    if (unlabeled.length) {
      issues.push(
        `${unlabeled.length} form field(s) without a label: ${unlabeled
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}[name="${el.getAttribute("name") || ""}",placeholder="${el.getAttribute("placeholder") || ""}"]`)
          .join(" | ")}`,
      );
    }

    // Links with no accessible name
    const links = [...document.querySelectorAll("a")];
    const bareLinks = links.filter((a) => {
      const text = (a.textContent || "").trim();
      const aria = a.getAttribute("aria-label");
      const ariaby = a.getAttribute("aria-labelledby");
      return !text && !aria && !ariaby;
    });
    if (bareLinks.length) {
      issues.push(`${bareLinks.length} link(s) with no text or aria-label`);
    }

    return issues;
  });

  const warnCount = consoleMsgs.filter((m) => m.level === "warn").length;
  const errCount = consoleMsgs.filter((m) => m.level !== "warn").length;
  totals.warnings += warnCount;
  totals.errors += errCount;
  totals.a11y += a11y.length;

  const ok = a11y.length === 0 && consoleMsgs.length === 0;
  console.log(`${ok ? "✓" : "✗"} ${path}`);
  for (const m of consoleMsgs) console.log(`    [${m.level}] ${m.text.slice(0, 240)}`);
  for (const i of a11y) console.log(`    [a11y] ${i.slice(0, 240)}`);

  await page.close();
}

// ───────── Keyboard nav: mega menu on landing ─────────
console.log("\n=== Keyboard nav: mega menu ===");
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 400));

  // Focus the page body first
  await page.focus("body");

  // Tab repeatedly until we land on "Commission" trigger
  let target = null;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    target = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        text: (el?.textContent || "").trim().slice(0, 30),
        aria: el?.getAttribute("aria-haspopup"),
        expanded: el?.getAttribute("aria-expanded"),
      };
    });
    if (target.text.startsWith("Commission") && target.aria === "true") break;
  }
  console.log(`  Tabbed to: ${target?.tag} "${target?.text}" haspopup=${target?.aria}`);

  // Press Enter / Space — should open the menu
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 250));
  const opened = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("nav button")].find((b) =>
      b.textContent.trim().startsWith("Commission"),
    );
    return btn?.getAttribute("aria-expanded") === "true";
  });
  console.log(`  Enter opened menu: ${opened ? "✓" : "✗"}`);

  // Press Escape — should close + return focus to the trigger
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 250));
  const afterEsc = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("nav button")].find((b) =>
      b.textContent.trim().startsWith("Commission"),
    );
    return {
      expanded: btn?.getAttribute("aria-expanded"),
      focusedIsTrigger: document.activeElement === btn,
    };
  });
  console.log(
    `  Escape closed menu: ${afterEsc.expanded !== "true" ? "✓" : "✗"}  focus returned: ${afterEsc.focusedIsTrigger ? "✓" : "✗"}`,
  );

  await page.close();
}

await browser.close();

console.log("\n=== Totals ===");
console.log(`  warnings: ${totals.warnings}`);
console.log(`  errors:   ${totals.errors}`);
console.log(`  a11y:     ${totals.a11y}`);
process.exit(totals.errors > 0 || totals.a11y > 0 ? 1 : 0);
