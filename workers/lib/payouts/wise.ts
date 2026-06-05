// Wise (formerly TransferWise) adapter.
//
// Docs: https://docs.wise.com/api-docs/api-reference
// Flow: create quote → create recipient (if not cached) → create
// transfer → fund transfer from our business balance.
//
// We cache the Wise recipient ID on PayoutPreference so we only
// create it the first time. Quotes are cheap to recreate per
// disbursement.

import type { Env } from '../../types';
import type { DisbursementRequest, DisbursementResult, PayoutPreference } from './types';

const BASE = 'https://api.wise.com';

function bearer(env: Env): string | null {
  if (!env.WISE_API_TOKEN || !env.WISE_PROFILE_ID) return null;
  return `Bearer ${env.WISE_API_TOKEN}`;
}

export async function sendWiseTransfer(
  env: Env,
  pref: PayoutPreference,
  req: DisbursementRequest,
  ctx: { updateRecipientId: (id: string) => Promise<void> },
): Promise<DisbursementResult> {
  const auth = bearer(env);
  if (!auth) {
    return {
      ok: false,
      status: 'queued',
      error: 'WISE_API_TOKEN / WISE_PROFILE_ID not configured — queued',
    };
  }
  const profileId = env.WISE_PROFILE_ID!;
  const targetCurrency = pref.wise_currency || 'USD';

  // 1. Quote
  const quoteRes = await fetch(`${BASE}/v3/profiles/${profileId}/quotes`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceCurrency: 'USD',
      targetCurrency,
      sourceAmount: req.amountUsd,
      payOut: 'BANK_TRANSFER',
    }),
  });
  if (!quoteRes.ok) {
    const t = await quoteRes.text();
    return { ok: false, status: 'failed', error: `Wise quote ${quoteRes.status}: ${t.slice(0, 300)}` };
  }
  const quote = (await quoteRes.json()) as { id: string };

  // 2. Recipient (create on first use; cache after)
  let recipientId = pref.wise_recipient_id;
  if (!recipientId) {
    const recipientBody = buildRecipientBody(pref);
    if (!recipientBody) {
      return {
        ok: false,
        status: 'failed',
        error: 'Wise recipient details incomplete — IBAN/account number required',
      };
    }
    const recRes = await fetch(`${BASE}/v1/accounts`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(recipientBody),
    });
    if (!recRes.ok) {
      const t = await recRes.text();
      return { ok: false, status: 'failed', error: `Wise recipient ${recRes.status}: ${t.slice(0, 300)}` };
    }
    const rec = (await recRes.json()) as { id: number };
    recipientId = String(rec.id);
    await ctx.updateRecipientId(recipientId);
  }

  // 3. Transfer
  const transferRes = await fetch(`${BASE}/v1/transfers`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetAccount: Number(recipientId),
      quoteUuid: quote.id,
      customerTransactionId: `${req.commissionId}-${Date.now()}`,
      details: { reference: req.memo.slice(0, 80) },
    }),
  });
  if (!transferRes.ok) {
    const t = await transferRes.text();
    return { ok: false, status: 'failed', error: `Wise transfer ${transferRes.status}: ${t.slice(0, 300)}` };
  }
  const transfer = (await transferRes.json()) as { id: number };

  // 4. Fund from balance
  const fundRes = await fetch(
    `${BASE}/v3/profiles/${profileId}/transfers/${transfer.id}/payments`,
    {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'BALANCE' }),
    },
  );
  if (!fundRes.ok) {
    const t = await fundRes.text();
    return {
      ok: false,
      status: 'failed',
      externalId: String(transfer.id),
      error: `Wise funding ${fundRes.status}: ${t.slice(0, 300)}`,
    };
  }

  return {
    ok: true,
    externalId: String(transfer.id),
    status: 'sent',
    metadata: { quoteId: quote.id, recipientId },
  };
}

function buildRecipientBody(pref: PayoutPreference): Record<string, unknown> | null {
  if (!pref.wise_country || !pref.wise_currency || !pref.wise_account_holder_name) return null;
  const base = {
    currency: pref.wise_currency,
    type: pref.wise_iban ? 'iban' : 'sort_code',
    profile: undefined,
    accountHolderName: pref.wise_account_holder_name,
    legalType: 'PRIVATE',
    details: {} as Record<string, unknown>,
  };
  if (pref.wise_iban) {
    base.details.IBAN = pref.wise_iban;
  } else if (pref.wise_account_number && pref.wise_bank_code) {
    base.details.accountNumber = pref.wise_account_number;
    base.details.sortCode = pref.wise_bank_code;
  } else {
    return null;
  }
  return base;
}
