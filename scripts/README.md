# scripts/

Reusable test + smoke-check scripts. Run from the repo root with `node scripts/<file>.mjs`.

## `validate-migrations.mjs`

Applies every D1 migration to an in-memory SQLite database (via
`better-sqlite3`), then asserts seed counts, FTS5 search behavior,
SQL feature support (e.g. `COUNT(*) FILTER`), and foreign-key
enforcement. Catches schema regressions before they hit D1.

```bash
npm run validate:migrations
```

Wired into CI on every push.

## `api-smoke.mjs`

Terminal version of the `/api-status` page. Hits a live Worker and checks
that D1 is seeded, FTS5 works, auth responds, and the ledger endpoint
returns stats. Defaults to `https://catholicart.workers.dev` but accepts
a `BASE=` env var or a positional URL argument.

```bash
npm run smoke                                  # production
node scripts/api-smoke.mjs http://localhost:8787
node scripts/api-smoke.mjs --json              # machine-readable
```

Exit code 0 = all checks passed, 1 = at least one failed.

## `walkthrough.mjs`

End-to-end lifecycle smoke test. Boots a headless Chrome, wipes localStorage,
then drives a fresh commission through every state transition:

1. Browse → artist profile → commission form
2. Submit scope → workspace
3. Switch to Artist → send a quote
4. Switch to Patron → fund the deposit
5. Switch to Artist → post a WIP update → mark midpoint
6. Switch to Patron → release midpoint
7. Switch to Artist → mark complete
8. Switch to Patron → release final
9. Record the blessing
10. View the certificate
11. Verify the Ledger, Catalog, and Dashboard reflect the new commission

Captures 25 screenshots into `/tmp/walkthrough/` and reports any missing
buttons or runtime errors. Exit code 0 means clean.

```bash
npm run dev &     # in a separate terminal
node scripts/walkthrough.mjs
```

Requires the Puppeteer Chromium at the path baked into the script (the one
that comes from `puppeteer-core`'s default Chrome download).
