// Translate any keys in src/i18n/en.json that are missing from each
// target-locale file. Calls the deployed worker at /api/translate
// which wraps `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
//
// Usage: node scripts/translate-i18n.mjs
//
// Env:
//   LOCAVIT_TRANSLATE_URL  Defaults to https://catholicart.jer-f84.workers.dev/api/translate

import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "../src/i18n");
const TARGETS = ["es", "it", "fr"];
const URL =
  process.env.LOCAVIT_TRANSLATE_URL ||
  "https://catholicart.jer-f84.workers.dev/api/translate";

async function readJson(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

async function writeJson(path, obj) {
  const sorted = Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(path, JSON.stringify(sorted, null, 2) + "\n");
}

async function translateBatch(texts, target_lang) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, target_lang, source_lang: "en" }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Translate API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.translations;
}

const en = await readJson(resolve(DIR, "en.json"));
const enKeys = Object.keys(en);

for (const lang of TARGETS) {
  const path = resolve(DIR, `${lang}.json`);
  const current = await readJson(path);
  const missing = enKeys.filter((k) => !(k in current));
  if (missing.length === 0) {
    console.log(`✓ ${lang}: up to date (${enKeys.length} keys)`);
    continue;
  }
  console.log(`→ ${lang}: translating ${missing.length} key(s)…`);
  const texts = missing.map((k) => en[k]);
  // Batches of 20 to keep prompts manageable and avoid Worker CPU
  // limits. 70b is slow per call; smaller batches finish faster.
  const out = {};
  for (let i = 0; i < texts.length; i += 20) {
    const chunk = texts.slice(i, i + 20);
    const chunkKeys = missing.slice(i, i + 20);
    const translated = await translateBatch(chunk, lang);
    for (let j = 0; j < chunkKeys.length; j++) {
      out[chunkKeys[j]] = translated[j];
    }
  }
  const merged = { ...current, ...out };
  await writeJson(path, merged);
  console.log(`✓ ${lang}: wrote ${missing.length} new translation(s)`);
}

console.log("done");
