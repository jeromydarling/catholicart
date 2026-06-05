// PayPal Payouts API adapter.
//
// Docs: https://developer.paypal.com/docs/api/payments.payouts-batch/v1/
// Auth: OAuth2 client_credentials → bearer token.

import type { Env } from '../../types';
import type { DisbursementRequest, DisbursementResult, PayoutPreference } from './types';

function host(env: Env): string {
  return env.PAYPAL_LIVE === 'true'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getToken(env: Env): Promise<string | null> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) return null;
  const basic = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(host(env) + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { access_token?: string };
  return body.access_token ?? null;
}

export async function sendPayPalPayout(
  env: Env,
  pref: PayoutPreference,
  req: DisbursementRequest,
): Promise<DisbursementResult> {
  if (!pref.paypal_email) {
    return { ok: false, status: 'failed', error: 'PayPal email missing on artist preferences' };
  }
  const token = await getToken(env);
  if (!token) {
    return {
      ok: false,
      status: 'queued',
      error: 'PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not configured — queued',
    };
  }

  const res = await fetch(host(env) + '/v1/payments/payouts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `${req.commissionId}-${Date.now()}`,
        email_subject: 'Your Locavit payment',
        email_message: req.memo.slice(0, 1000),
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: { value: req.amountUsd.toFixed(2), currency: 'USD' },
          receiver: pref.paypal_email,
          note: req.memo.slice(0, 250),
          sender_item_id: req.commissionId,
        },
      ],
    }),
  });

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      status: 'failed',
      error: `PayPal ${res.status}: ${JSON.stringify(data).slice(0, 300)}`,
    };
  }
  const obj = (data ?? {}) as { batch_header?: { payout_batch_id?: string } };
  return {
    ok: true,
    externalId: obj.batch_header?.payout_batch_id,
    status: 'sent',
  };
}
