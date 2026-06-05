// Payout dispatch — routes a disbursement to the right adapter
// based on the artist's saved payout preference, and records the
// attempt in payout_disbursements regardless of outcome.

import type { Env } from '../../types';
import type { DisbursementRequest, DisbursementResult, PayoutPreference } from './types';
import { sendCheck } from './checkbook';
import { sendWiseTransfer } from './wise';
import { sendPayPalPayout } from './paypal';
import { sendStripeTransfer } from './stripe';

export async function getPreference(
  db: D1Database,
  artistId: string,
): Promise<PayoutPreference | null> {
  const row = await db
    .prepare('SELECT * FROM payout_preferences WHERE artist_id = ?')
    .bind(artistId)
    .first<PayoutPreference>();
  return row ?? null;
}

export async function upsertPreference(
  db: D1Database,
  artistId: string,
  patch: Partial<PayoutPreference>,
): Promise<void> {
  const existing = await getPreference(db, artistId);
  const now = new Date().toISOString();
  if (!existing) {
    await db
      .prepare(
        `INSERT INTO payout_preferences (artist_id, method, updated_at) VALUES (?, 'unset', ?)`,
      )
      .bind(artistId, now)
      .run();
  }
  const fields: Array<keyof PayoutPreference> = [
    'method',
    'wise_recipient_id',
    'wise_currency',
    'wise_account_holder_name',
    'wise_iban',
    'wise_bank_code',
    'wise_account_number',
    'wise_country',
    'check_payee_name',
    'check_address_line1',
    'check_address_line2',
    'check_city',
    'check_state',
    'check_postal_code',
    'check_country',
    'paypal_email',
    'manual_wire_notes',
    'status',
  ];
  const setClauses: string[] = [];
  const binds: unknown[] = [];
  for (const f of fields) {
    if (f in patch) {
      setClauses.push(`${f} = ?`);
      binds.push((patch[f] as unknown) ?? null);
    }
  }
  if (setClauses.length === 0) return;
  setClauses.push('updated_at = ?');
  binds.push(now);
  binds.push(artistId);
  await db
    .prepare(`UPDATE payout_preferences SET ${setClauses.join(', ')} WHERE artist_id = ?`)
    .bind(...binds)
    .run();
}

export async function disburse(
  env: Env,
  req: DisbursementRequest,
): Promise<DisbursementResult> {
  const pref = await getPreference(env.DB, req.artistId);
  if (!pref || pref.method === 'unset') {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO payout_disbursements
         (id, artist_id, commission_id, method, amount_usd, status, failure_reason)
       VALUES (?, ?, ?, 'unset', ?, 'queued', ?)`,
    )
      .bind(
        id,
        req.artistId,
        req.commissionId,
        req.amountUsd,
        'No payout method on file — artist must set one before release',
      )
      .run();
    return { ok: false, status: 'queued', error: 'No payout method on file' };
  }

  let result: DisbursementResult;
  switch (pref.method) {
    case 'stripe_connect': {
      const acct = await env.DB.prepare(
        'SELECT stripe_account_id FROM connect_accounts WHERE artist_id = ?',
      )
        .bind(req.artistId)
        .first<{ stripe_account_id: string | null }>();
      result = await sendStripeTransfer(env, acct?.stripe_account_id ?? '', req);
      break;
    }
    case 'paper_check': {
      result = await sendCheck(env, pref, req);
      break;
    }
    case 'wise': {
      result = await sendWiseTransfer(env, pref, req, {
        updateRecipientId: (id) =>
          upsertPreference(env.DB, req.artistId, { wise_recipient_id: id }),
      });
      break;
    }
    case 'paypal': {
      result = await sendPayPalPayout(env, pref, req);
      break;
    }
    case 'manual_wire': {
      // No automation — operator handles out-of-band. Record intent.
      result = {
        ok: true,
        status: 'queued',
        metadata: { note: 'Manual wire — operator to process' },
      };
      break;
    }
    default: {
      result = { ok: false, status: 'failed', error: `Unknown method: ${String(pref.method)}` };
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO payout_disbursements
       (id, artist_id, commission_id, method, amount_usd, fee_usd, external_id, status, failure_reason, metadata, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      req.artistId,
      req.commissionId,
      pref.method,
      req.amountUsd,
      result.feeUsd ?? 0,
      result.externalId ?? null,
      result.status,
      result.error ?? null,
      result.metadata ? JSON.stringify(result.metadata) : null,
      result.status === 'sent' ? now : null,
    )
    .run();

  return result;
}
