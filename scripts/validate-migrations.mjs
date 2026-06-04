#!/usr/bin/env node
// Apply all D1 migrations to an in-memory SQLite via better-sqlite3
// and assert seed counts + FTS5 behavior. A pre-deploy sanity check.

import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const db = new Database(':memory:');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const files = [
  'migrations/d1/0001_init.sql',
  'migrations/d1/0002_seed.sql',
  'migrations/d1/0003_seed_artists.sql',
];

let failures = 0;

for (const f of files) {
  const sql = readFileSync(f, 'utf8');
  try {
    db.exec(sql);
    console.log(`✓ applied ${f}`);
  } catch (e) {
    console.error(`✗ ${f}: ${e.message}`);
    process.exit(1);
  }
}

const expected = {
  categories: 8,
  saints: 20,
  dioceses: 12,
  religious_orders: 4,
  artists: 12,
};

console.log('\nseed counts:');
for (const [t, exp] of Object.entries(expected)) {
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get();
  const ok = n === exp;
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${t}: ${n}${ok ? '' : ` (expected ${exp})`}`);
}

console.log('\njoin tables (non-zero is what matters):');
for (const t of ['artist_categories', 'artist_saints', 'artist_tiers', 'artworks']) {
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get();
  const ok = n > 0;
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${t}: ${n}`);
}

console.log('\nFTS5 search:');
const fts = db
  .prepare(
    `SELECT artists.name AS name FROM artists
       JOIN artists_fts ON artists.rowid = artists_fts.rowid
       WHERE artists_fts MATCH ?`,
  )
  .all('Maria');
const ftsOk = fts.length > 0;
if (!ftsOk) failures++;
console.log(`  ${ftsOk ? '✓' : '✗'} "Maria" → ${fts.length} match(es)${fts.length ? `: ${fts.map((r) => r.name).join(', ')}` : ''}`);

console.log('\nSQL feature checks (D1/SQLite ≥ 3.30):');
try {
  const r = db.prepare(`SELECT COUNT(*) FILTER (WHERE stage = 'inquiry') AS n FROM commissions`).get();
  console.log(`  ✓ COUNT(*) FILTER (WHERE …) → ${r.n}`);
} catch (e) {
  console.log(`  ✗ COUNT(*) FILTER: ${e.message}`);
  failures++;
}

console.log('\nforeign key constraints respected:');
try {
  db.prepare(`INSERT INTO artist_categories (artist_id, category_slug) VALUES ('does-not-exist', 'icons-tempera-on-panel')`).run();
  console.log(`  ✗ insert with bogus FK succeeded (FKs not enforced!)`);
  failures++;
} catch (e) {
  console.log(`  ✓ bogus FK rejected: ${e.message.split('\n')[0]}`);
}

console.log('');
if (failures === 0) {
  console.log('all green');
  process.exit(0);
} else {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
