// Checkbook.io adapter — paper and digital checks.
//
// Docs: https://checkbook.io/docs/api
// Auth: header `Authorization: <API_KEY>:<API_SECRET>`
//
// Two product modes:
// - Digital: recipient gets an email, deposits via web/mobile (cheaper).
// - Physical: recipient receives a printed check in the mail (US/CA).
//
// We default to physical when a mailing address is on file; otherwise
// digital using the artist's account email.

import type { Env } from '../../types';
import type { DisbursementRequest, DisbursementResult, PayoutPreference } from './types';

const BASE = 'https://checkbook.io/v3';

function auth(env: Env): string | null {
  if (!env.CHECKBOOK_API_KEY || !env.CHECKBOOK_API_SECRET) return null;
  return `${env.CHECKBOOK_API_KEY}:${env.CHECKBOOK_API_SECRET}`;
}

export async function sendCheck(
  env: Env,
  pref: PayoutPreference,
  req: DisbursementRequest,
): Promise<DisbursementResult> {
  const a = auth(env);
  if (!a) {
    return {
      ok: false,
      status: 'queued',
      error: 'CHECKBOOK_API_KEY / CHECKBOOK_API_SECRET not configured — queued',
    };
  }

  const hasAddress =
    pref.check_address_line1 &&
    pref.check_city &&
    pref.check_postal_code &&
    pref.check_country;

  const physical = Boolean(hasAddress);
  const endpoint = physical ? '/check/physical' : '/check/digital';

  const body: Record<string, unknown> = {
    recipient: pref.check_payee_name ?? req.artistName,
    name: pref.check_payee_name ?? req.artistName,
    amount: req.amountUsd,
    description: req.memo.slice(0, 120),
    number: req.commissionId.slice(0, 12),
  };

  if (physical) {
    body.address = {
      line_1: pref.check_address_line1,
      line_2: pref.check_address_line2 ?? '',
      city: pref.check_city,
      state: pref.check_state ?? '',
      zip: pref.check_postal_code,
      country: pref.check_country ?? 'US',
    };
  } else {
    body.recipient = req.artistEmail; // digital requires email
    body.name = pref.check_payee_name ?? req.artistName;
  }

  const res = await fetch(BASE + endpoint, {
    method: 'POST',
    headers: {
      Authorization: a,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      status: 'failed',
      error: `Checkbook ${res.status}: ${JSON.stringify(data).slice(0, 300)}`,
    };
  }

  const obj = (data ?? {}) as { id?: string; status?: string };
  return {
    ok: true,
    externalId: obj.id,
    status: 'sent',
    metadata: { kind: physical ? 'physical' : 'digital', raw_status: obj.status ?? null },
  };
}
