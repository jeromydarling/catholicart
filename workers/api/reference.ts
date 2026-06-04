// Public reference-data endpoints: categories, saints, dioceses, orders.

import { Hono } from 'hono';
import type { Env, AppVariables } from '../types';
import { all } from '../lib/db';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.get('/categories', async (c) => {
  const rows = await all(c.env.DB, `SELECT * FROM categories ORDER BY sort_order ASC`);
  return c.json({ categories: rows });
});

app.get('/saints', async (c) => {
  const rows = await all<any>(c.env.DB, `SELECT * FROM saints ORDER BY feast_month, feast_day`);
  // Parse JSON arrays
  for (const r of rows) {
    try { r.also = JSON.parse(r.also); } catch { r.also = []; }
    try { r.patron_of = JSON.parse(r.patron_of); } catch { r.patron_of = []; }
  }
  return c.json({ saints: rows });
});

app.get('/dioceses', async (c) => {
  const rows = await all(c.env.DB, `SELECT * FROM dioceses ORDER BY name`);
  return c.json({ dioceses: rows });
});

app.get('/orders', async (c) => {
  const rows = await all(c.env.DB, `SELECT * FROM religious_orders ORDER BY slug`);
  return c.json({ orders: rows });
});

export default app;
