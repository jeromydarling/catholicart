-- Payout preferences + disbursements (multi-rail).
--
-- Each artist picks one method. The same dispatch table is used by
-- the final-milestone release code. Stripe Connect remains in
-- connect_accounts (already exists); this table holds the lighter-
-- weight alternatives — Wise, paper check via Checkbook.io, PayPal,
-- and a manual-wire fallback for anything else.

CREATE TABLE payout_preferences (
  artist_id          TEXT PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,
  method             TEXT NOT NULL DEFAULT 'unset'
                       CHECK (method IN (
                         'unset',
                         'stripe_connect',
                         'wise',
                         'paper_check',
                         'paypal',
                         'manual_wire'
                       )),

  -- Wise (international bank transfer) — recipient details we send.
  -- The Wise recipient is created on first save; we cache its ID.
  wise_recipient_id        TEXT,
  wise_currency            TEXT,
  wise_account_holder_name TEXT,
  wise_iban                TEXT,
  wise_bank_code           TEXT,
  wise_account_number      TEXT,
  wise_country             TEXT,

  -- Paper check (mailed via Checkbook.io) — US/Canada.
  check_payee_name    TEXT,
  check_address_line1 TEXT,
  check_address_line2 TEXT,
  check_city          TEXT,
  check_state         TEXT,
  check_postal_code   TEXT,
  check_country       TEXT,

  -- PayPal Payouts — just an email.
  paypal_email TEXT COLLATE NOCASE,

  -- Manual wire — free text the artist gives us; we email them
  -- instructions and they confirm out-of-band.
  manual_wire_notes TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
           CHECK (status IN ('pending', 'verified', 'failed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE payout_disbursements (
  id              TEXT PRIMARY KEY,
  artist_id       TEXT NOT NULL REFERENCES artists(id) ON DELETE RESTRICT,
  commission_id   TEXT REFERENCES commissions(id) ON DELETE SET NULL,
  method          TEXT NOT NULL,
  amount_usd      INTEGER NOT NULL,
  fee_usd         INTEGER NOT NULL DEFAULT 0,
  external_id     TEXT,   -- provider's reference (Wise transfer id, Checkbook check id, etc.)
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'cancelled')),
  failure_reason  TEXT,
  metadata        TEXT,   -- JSON for adapter-specific context
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  sent_at         TEXT,
  delivered_at    TEXT
);

CREATE INDEX payout_disbursements_artist_idx ON payout_disbursements(artist_id);
CREATE INDEX payout_disbursements_status_idx ON payout_disbursements(status);
CREATE INDEX payout_disbursements_commission_idx ON payout_disbursements(commission_id);
