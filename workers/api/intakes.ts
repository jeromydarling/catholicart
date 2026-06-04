// Institutional intakes (B2B RFP) + proposals + approval chain.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { all, first, newId, nowIso, run } from '../lib/db';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.get('/', async (c) => {
  const open = c.req.query('open') === 'true';
  const sql = open
    ? `SELECT * FROM intakes WHERE status IN ('open','shortlisting') ORDER BY created_at DESC`
    : `SELECT * FROM intakes ORDER BY created_at DESC LIMIT 100`;
  const rows = await all(c.env.DB, sql);
  return c.json({ intakes: rows });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const intake = await first<any>(c.env.DB, `SELECT * FROM intakes WHERE id = ?`, id);
  if (!intake) return c.json({ ok: false }, 404);
  const approvals = await all(c.env.DB, `SELECT * FROM intake_approvals WHERE intake_id = ? ORDER BY sort_order`, id);
  const proposals = await all(c.env.DB, `SELECT * FROM proposals WHERE intake_id = ? ORDER BY submitted_at DESC`, id);
  return c.json({ intake, approvals, proposals });
});

const CreateIntake = z.object({
  kind: z.enum(['diocese-bulk', 'parish-altar', 'religious-order', 'school', 'other-institution']),
  institution_name: z.string().min(1),
  diocese: z.string().optional(),
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  contact_role: z.string().optional(),
  title: z.string().min(1),
  brief: z.string().min(1),
  craft: z.string().optional(),
  budget_total_usd: z.number().optional(),
  budget_per_work_usd: z.number().optional(),
  quantity: z.number().int().positive(),
  preferred_delivery: z.string().optional(),
  feast_slug: z.string().optional(),
  feast_name: z.string().optional(),
  feast_date: z.string().optional(),
  invoicing_terms: z.enum(['stripe-immediate', 'net-30', 'net-60', 'purchase-order']).default('net-30'),
  po_number: z.string().optional(),
  approvals: z.array(z.object({
    role: z.string().min(1),
    name: z.string().optional(),
    email: z.string().email().optional(),
  })).default([]),
});

app.post('/', async (c) => {
  const parsed = CreateIntake.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: parsed.error.flatten() }, 400);

  const id = newId('ink');
  const d = parsed.data;
  await run(c.env.DB,
    `INSERT INTO intakes (
       id, kind, institution_name, diocese, contact_name, contact_email, contact_role,
       title, brief, craft, budget_total_usd, budget_per_work_usd, quantity,
       preferred_delivery, feast_slug, feast_name, feast_date,
       invoicing_terms, po_number, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
    id, d.kind, d.institution_name, d.diocese ?? null, d.contact_name, d.contact_email, d.contact_role ?? null,
    d.title, d.brief, d.craft ?? null, d.budget_total_usd ?? null, d.budget_per_work_usd ?? null, d.quantity,
    d.preferred_delivery ?? null, d.feast_slug ?? null, d.feast_name ?? null, d.feast_date ?? null,
    d.invoicing_terms, d.po_number ?? null,
  );

  for (let i = 0; i < d.approvals.length; i++) {
    const a = d.approvals[i];
    await run(c.env.DB,
      `INSERT INTO intake_approvals (id, intake_id, role, name, email, status, sort_order) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      newId('apr'), id, a.role, a.name ?? null, a.email ?? null, i,
    );
  }

  return c.json({ intake: { id }, ok: true });
});

const ProposalBody = z.object({
  artist_slug: z.string(),
  price_per_work_usd: z.number().int().positive(),
  estimated_weeks: z.number().int().positive(),
  pitch_body: z.string().min(1),
});

app.post('/:id/proposals', async (c) => {
  const id = c.req.param('id');
  const parsed = ProposalBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: parsed.error.flatten() }, 400);

  const intake = await first<{ id: string; status: string; quantity: number }>(
    c.env.DB, `SELECT id, status, quantity FROM intakes WHERE id = ?`, id,
  );
  if (!intake) return c.json({ ok: false }, 404);
  if (intake.status !== 'open' && intake.status !== 'shortlisting') {
    return c.json({ ok: false, error: 'intake not accepting proposals' }, 400);
  }

  const artist = await first<{ id: string; portrait_from: string; portrait_to: string }>(
    c.env.DB, `SELECT id, portrait_from, portrait_to FROM artists WHERE slug = ?`, parsed.data.artist_slug,
  );
  if (!artist) return c.json({ ok: false, error: 'artist not found' }, 404);

  const propId = newId('prp');
  await run(c.env.DB,
    `INSERT INTO proposals (
       id, intake_id, artist_id, price_per_work_usd, total_price_usd,
       estimated_weeks, pitch_body, palette_from, palette_to, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
    propId, id, artist.id, parsed.data.price_per_work_usd,
    parsed.data.price_per_work_usd * intake.quantity,
    parsed.data.estimated_weeks, parsed.data.pitch_body,
    artist.portrait_from, artist.portrait_to,
  );

  return c.json({ proposal: { id: propId }, ok: true });
});

const ApprovalUpdate = z.object({ status: z.enum(['approved', 'declined']), note: z.string().optional() });
app.patch('/:id/approvals/:role', async (c) => {
  const id = c.req.param('id');
  const role = c.req.param('role');
  const parsed = ApprovalUpdate.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  await run(c.env.DB,
    `UPDATE intake_approvals SET status = ?, decided_at = ?, note = ? WHERE intake_id = ? AND role = ?`,
    parsed.data.status, nowIso(), parsed.data.note ?? null, id, role,
  );
  return c.json({ ok: true });
});

app.post('/:id/award/:proposalId', async (c) => {
  const id = c.req.param('id');
  const propId = c.req.param('proposalId');
  await run(c.env.DB,
    `UPDATE proposals SET status = CASE WHEN id = ? THEN 'awarded' ELSE 'declined' END, decided_at = ? WHERE intake_id = ?`,
    propId, nowIso(), id,
  );
  await run(c.env.DB,
    `UPDATE intakes SET status = 'awarded', awarded_proposal_id = ?, updated_at = ? WHERE id = ?`,
    propId, nowIso(), id,
  );
  return c.json({ ok: true });
});

export default app;
