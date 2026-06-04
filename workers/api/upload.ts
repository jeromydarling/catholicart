// R2 upload: returns a presigned-style direct upload URL (we proxy
// through the Worker since R2 in this setup doesn't expose its own
// signed-URL endpoint). Patron / artist uploads a WIP image via:
//
//   1. POST /api/upload/wip → returns { upload_url, image_url }
//   2. PUT upload_url with the file body
//   3. Use image_url when calling POST /api/commissions/:id/wip
//
// In a tighter implementation we'd issue actual S3 V4 signed PUT URLs
// against the R2 S3-compat endpoint. This Worker-proxy approach keeps
// things simple and lets us authenticate uploads via the session.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AppVariables } from '../types';
import { newId } from '../lib/db';
import { requireAuth } from '../lib/auth';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const WipBody = z.object({
  commission_id: z.string(),
  filename: z.string(),
  content_type: z.string().default('image/jpeg'),
});

// POST /api/upload/wip — request an upload key.
app.post('/wip', requireAuth(), async (c) => {
  const parsed = WipBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false }, 400);
  const ext = parsed.data.filename.split('.').pop() ?? 'jpg';
  const key = `commissions/${parsed.data.commission_id}/wip/${newId('img')}.${ext}`;
  return c.json({
    upload_url: `/api/upload/put?key=${encodeURIComponent(key)}`,
    image_url: `/api/upload/get?key=${encodeURIComponent(key)}`,
    key,
  });
});

// PUT /api/upload/put?key=… — accept the actual file body, store in R2.
app.put('/put', requireAuth(), async (c) => {
  const key = c.req.query('key');
  if (!key) return c.json({ ok: false }, 400);
  // Limit size to 25MB to avoid DoS
  const body = await c.req.arrayBuffer();
  if (body.byteLength > 25 * 1024 * 1024) {
    return c.json({ ok: false, error: 'file too large (max 25MB)' }, 413);
  }
  await c.env.BUCKET.put(key, body, {
    httpMetadata: {
      contentType: c.req.header('content-type') ?? 'application/octet-stream',
    },
  });
  return c.json({ ok: true, key });
});

// GET /api/upload/get?key=… — serve an R2 object publicly.
app.get('/get', async (c) => {
  const key = c.req.query('key');
  if (!key) return c.json({ ok: false }, 400);
  const obj = await c.env.BUCKET.get(key);
  if (!obj) return c.json({ ok: false }, 404);
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
      'etag': obj.httpEtag,
    },
  });
});

export default app;
