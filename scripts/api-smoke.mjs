#!/usr/bin/env node
// CLI smoke test for the catholicart Worker.
//
// Mirrors the /api-status page checks (Worker reachable, D1 seeds, FTS5,
// auth, ledger) but runs from a terminal so it can be wired into CI or
// scripted post-deploy.
//
// Usage:
//   node scripts/api-smoke.mjs                       # hits production
//   node scripts/api-smoke.mjs https://example.dev   # hits given origin
//   BASE=https://example.dev node scripts/api-smoke.mjs
//   node scripts/api-smoke.mjs --json                # machine-readable

const BASE =
  process.argv.find((a) => a.startsWith('http')) ||
  process.env.BASE ||
  'https://catholicart.workers.dev';

const JSON_OUT = process.argv.includes('--json');
// --infra-only skips the secret-presence checks. Useful right after
// cf-bootstrap-cloud completes (before cf-worker-secret-bulk runs)
// so the post-bootstrap auto-smoke doesn't false-alarm on RESEND.
const INFRA_ONLY = process.argv.includes('--infra-only');

const CHECKS = [
  {
    name: 'Worker is reachable',
    run: async () => {
      const r = await get('/api/health');
      if (!r.ok) return fail(r);
      return pass(`time=${r.data.time}`);
    },
  },
  {
    name: 'D1 — categories seeded (8)',
    run: async () => {
      const r = await get('/api/categories');
      if (!r.ok) return fail(r);
      const n = (r.data.categories ?? []).length;
      return n === 8 ? pass(`${n} categories`) : fail(`expected 8, got ${n}`);
    },
  },
  {
    name: 'D1 — saints seeded (20)',
    run: async () => {
      const r = await get('/api/saints');
      if (!r.ok) return fail(r);
      const n = (r.data.saints ?? []).length;
      return n === 20 ? pass(`${n} saints`) : fail(`expected 20, got ${n}`);
    },
  },
  {
    name: 'D1 — dioceses seeded (12)',
    run: async () => {
      const r = await get('/api/dioceses');
      if (!r.ok) return fail(r);
      const n = (r.data.dioceses ?? []).length;
      return n === 12 ? pass(`${n} dioceses`) : fail(`expected 12, got ${n}`);
    },
  },
  {
    name: 'D1 — religious orders seeded (4)',
    run: async () => {
      const r = await get('/api/orders');
      if (!r.ok) return fail(r);
      const n = (r.data.orders ?? []).length;
      return n === 4 ? pass(`${n} orders`) : fail(`expected 4, got ${n}`);
    },
  },
  {
    name: 'D1 — artists seeded (12)',
    run: async () => {
      const r = await get('/api/artists');
      if (!r.ok) return fail(r);
      const n = (r.data.artists ?? []).length;
      return n === 12 ? pass(`${n} artists`) : fail(`expected 12, got ${n}`);
    },
  },
  {
    name: "FTS5 — search 'Maria' returns matches",
    run: async () => {
      const r = await get('/api/artists?q=Maria');
      if (!r.ok) return fail(r);
      const n = (r.data.artists ?? []).length;
      return n > 0 ? pass(`${n} match(es)`) : fail('no matches');
    },
  },
  {
    name: 'Auth — /me returns null when unauthenticated',
    run: async () => {
      const r = await get('/api/auth/me');
      if (!r.ok) return fail(r);
      return r.data.user === null
        ? pass('anonymous')
        : pass(`signed in as ${r.data.user?.email ?? '?'}`);
    },
  },
  {
    name: 'Ledger — endpoint responds with stats',
    run: async () => {
      const r = await get('/api/ledger');
      if (!r.ok) return fail(r);
      const s = r.data.stats ?? {};
      return pass(`${s.completed ?? 0} completed, ${s.in_flight ?? 0} in flight`);
    },
  },
  {
    name: 'Config — /api/config returns public client values',
    run: async () => {
      const r = await get('/api/config');
      if (!r.ok) return fail(r);
      const hasMapbox = Boolean(r.data.mapbox_token);
      return hasMapbox
        ? pass('mapbox_token present')
        : fail('mapbox_token empty — set VITE_MAPBOX_TOKEN via cf-worker-secret-bulk');
    },
  },
  {
    name: 'Email — Cloudflare Send Email binding wired',
    optional: true,
    run: async () => {
      const r = await get('/api/config');
      if (!r.ok) return fail(r);
      return r.data.flags?.email_configured
        ? pass('EMAIL binding present')
        : fail('binding missing — onboard the sending domain at dash.cloudflare.com → Email Service');
    },
  },
  {
    name: 'Secrets — AUTH_SECRET set (session signing)',
    optional: true,
    run: async () => {
      const r = await get('/api/config');
      if (!r.ok) return fail(r);
      return r.data.flags?.auth_secret_configured
        ? pass('auth secret wired')
        : fail('not set — sessions will use insecure dev default');
    },
  },
];

async function get(path) {
  try {
    const res = await fetch(BASE + path, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text || res.statusText };
    }
    return { ok: true, data: await res.json() };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

function pass(message) {
  return { ok: true, message };
}
function fail(arg) {
  if (typeof arg === 'string') return { ok: false, message: arg };
  return { ok: false, message: `HTTP ${arg.status}: ${String(arg.error).slice(0, 140)}` };
}

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};
const isTTY = process.stdout.isTTY;
const c = (code, s) => (isTTY && !JSON_OUT ? `${code}${s}${ANSI.reset}` : s);

async function main() {
  const checks = INFRA_ONLY ? CHECKS.filter((c) => !c.optional) : CHECKS;
  if (!JSON_OUT) {
    console.log(c(ANSI.bold, `\n  catholicart api smoke`));
    console.log(c(ANSI.dim, `  base: ${BASE}${INFRA_ONLY ? ' (infra only)' : ''}\n`));
  }

  const results = [];
  for (const check of checks) {
    const t0 = Date.now();
    let r;
    try {
      r = await check.run();
    } catch (e) {
      r = { ok: false, message: `threw: ${e.message}` };
    }
    const dt = Date.now() - t0;
    results.push({ name: check.name, ok: r.ok, message: r.message, ms: dt });
    if (!JSON_OUT) {
      const mark = r.ok ? c(ANSI.green, '  ✓') : c(ANSI.red, '  ✗');
      const name = r.ok ? check.name : c(ANSI.bold, check.name);
      console.log(`${mark} ${name}  ${c(ANSI.dim, `(${dt}ms)`)}`);
      if (r.message) console.log(`    ${c(ANSI.dim, r.message)}`);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  if (JSON_OUT) {
    console.log(JSON.stringify({ base: BASE, passed, failed, results }, null, 2));
  } else {
    const line = `\n  ${passed} passed, ${failed} failed\n`;
    console.log(c(failed ? ANSI.red : ANSI.green, line));
  }

  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('smoke crashed:', e);
  process.exit(2);
});
