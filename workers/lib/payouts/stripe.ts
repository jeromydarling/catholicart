// Stripe Connect adapter — transfer to the artist's Connect account.
//
// Assumes the artist has completed Stripe Connect onboarding and the
// resulting stripe_account_id is in connect_accounts. We use the
// Transfers API (https://stripe.com/docs/api/transfers/create) to
// move USD from our Stripe balance to the destination.

import type { Env } from '../../types';
import type { DisbursementRequest, DisbursementResult } from './types';

const BASE = 'https://api.stripe.com/v1';

export async function sendStripeTransfer(
  env: Env,
  destinationAccountId: string,
  req: DisbursementRequest,
): Promise<DisbursementResult> {
  if (!env.STRIPE_SECRET_KEY) {
    return {
      ok: false,
      status: 'queued',
      error: 'STRIPE_SECRET_KEY not configured — queued',
    };
  }
  if (!destinationAccountId) {
    return {
      ok: false,
      status: 'failed',
      error: 'Artist has no Stripe Connect account on file',
    };
  }

  const form = new URLSearchParams({
    amount: String(req.amountUsd * 100), // Stripe takes cents
    currency: 'usd',
    destination: destinationAccountId,
    description: req.memo.slice(0, 200),
    'metadata[commission_id]': req.commissionId,
    'metadata[artist_id]': req.artistId,
  });

  const res = await fetch(BASE + '/transfers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      // Idempotency so retries don't double-pay.
      'Idempotency-Key': `transfer:${req.commissionId}`,
    },
    body: form.toString(),
  });

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      status: 'failed',
      error: `Stripe ${res.status}: ${JSON.stringify(data).slice(0, 300)}`,
    };
  }
  const obj = (data ?? {}) as { id?: string };
  return { ok: true, externalId: obj.id, status: 'sent' };
}
