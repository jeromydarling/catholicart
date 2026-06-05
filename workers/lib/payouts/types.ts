// Shared types for the payout dispatch layer.

export type PayoutMethod =
  | 'unset'
  | 'stripe_connect'
  | 'wise'
  | 'paper_check'
  | 'paypal'
  | 'manual_wire';

export interface PayoutPreference {
  artist_id: string;
  method: PayoutMethod;

  wise_recipient_id: string | null;
  wise_currency: string | null;
  wise_account_holder_name: string | null;
  wise_iban: string | null;
  wise_bank_code: string | null;
  wise_account_number: string | null;
  wise_country: string | null;

  check_payee_name: string | null;
  check_address_line1: string | null;
  check_address_line2: string | null;
  check_city: string | null;
  check_state: string | null;
  check_postal_code: string | null;
  check_country: string | null;

  paypal_email: string | null;

  manual_wire_notes: string | null;

  status: 'pending' | 'verified' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DisbursementRequest {
  artistId: string;
  artistEmail: string;
  artistName: string;
  commissionId: string;
  amountUsd: number;       // dollars (integer)
  memo: string;            // appears on the check / transfer reference
}

export interface DisbursementResult {
  ok: boolean;
  externalId?: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  feeUsd?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}
