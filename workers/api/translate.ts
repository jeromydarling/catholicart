// /api/translate — Llama 3.3 70b translation with a Locavit-aware
// system prompt. KV-cached so the build script only pays once per
// (source, target, text) tuple.

import { Hono } from 'hono';
import type { Env, AppVariables } from '../types';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  it: 'Italian',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  pl: 'Polish',
  uk: 'Ukrainian',
  ar: 'Arabic',
};

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

interface TranslateBody {
  texts?: unknown;
  target_lang?: unknown;
  source_lang?: unknown;
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function systemPrompt(source: string, target: string): string {
  return `You translate marketing and product copy for Locavit, a platform for commissioning Catholic sacred art. "Locavit" is third-person singular perfect of Latin "locare" — used on commissioned artworks to credit the patron ("X locavit" = "X commissioned this"). Translate from ${source} into ${target}.

Rules:
- Preserve the reverent, restrained tone. This is not marketing puffery — it sounds like a guild letter, not an ad.
- Keep "Locavit" untranslated (it is a brand name).
- Keep liturgical and theological terms intact: Theotokos, OSB, OFM, OP, OCD, OCarm, OCSO, Lauds, Vespers, kontakion, troparion, etc.
- Preserve em-dashes (—), ellipses (…), and curly quotes ("" '').
- Preserve placeholders in curly braces exactly as written: {count}, {countries}, {email}, {name}.
- Use the capitalization conventions of the target language (Spanish does NOT capitalize every word in headings; French sentence case).
- Output ONLY the translated text — no preface, no explanation, no quotes around the result, no "Translation:" prefix.`;
}

async function translateOne(
  env: Env,
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const cacheKey = `translate:v1:${target}:${await sha256(source + '|' + text)}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) return cached;

  const sourceName = LANGUAGE_NAMES[source] ?? source;
  const targetName = LANGUAGE_NAMES[target] ?? target;

  const ai = env.AI as unknown as {
    run: (
      model: string,
      input: Record<string, unknown>,
    ) => Promise<{ response?: string; result?: string }>;
  };
  const out = await ai.run(MODEL, {
    messages: [
      { role: 'system', content: systemPrompt(sourceName, targetName) },
      { role: 'user', content: text },
    ],
    max_tokens: 1024,
    temperature: 0.2,
  });
  const raw = (out.response ?? out.result ?? '').trim();
  // Strip wrapping quotes if Llama added them despite instructions.
  const cleaned = raw.replace(/^["'""]|["'""]$/g, '').trim();

  await env.CACHE.put(cacheKey, cleaned, { expirationTtl: 60 * 60 * 24 * 90 });
  return cleaned;
}

app.post('/translate', async (c) => {
  const body = (await c.req.json().catch(() => null)) as TranslateBody | null;
  if (!body || !Array.isArray(body.texts) || typeof body.target_lang !== 'string') {
    return c.json({ error: 'invalid_body' }, 400);
  }
  const source = typeof body.source_lang === 'string' ? body.source_lang : 'en';
  const target = body.target_lang;
  if (!LANGUAGE_NAMES[target]) {
    return c.json({ error: 'unsupported_target' }, 400);
  }
  const texts = (body.texts as unknown[]).filter((x): x is string => typeof x === 'string');
  if (texts.length === 0) return c.json({ translations: [] });
  if (texts.length > 200) return c.json({ error: 'too_many' }, 400);

  const out: string[] = [];
  for (const t of texts) {
    try {
      out.push(await translateOne(c.env, t, source, target));
    } catch (e) {
      out.push(t); // fail open to source
      console.error('translate error', (e as Error).message);
    }
  }
  return c.json({ translations: out });
});

export default app;
