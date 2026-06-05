-- Locavit · D1 (SQLite) schema
--
-- Ported from the Postgres-targeted Supabase migrations to SQLite for
-- Cloudflare D1. Differences from the Postgres version:
--
--   - Enums → TEXT with CHECK constraints
--   - UUID → TEXT (we generate via crypto.randomUUID() in the Worker)
--   - JSONB → TEXT (parsed with JSON.parse / JSON_EXTRACT)
--   - tsvector / GIN → SQLite FTS5 virtual tables
--   - timestamptz → TEXT (ISO 8601, UTC)
--   - RLS → enforced in Workers code (Hono middleware)
--   - now() → strftime('%Y-%m-%dT%H:%M:%fZ', 'now') or set by app
--
-- All ids are TEXT; the app generates them with crypto.randomUUID().

PRAGMA foreign_keys = ON;

-- ── users ────────────────────────────────────────────────────────────
-- Identity record. role gates access to admin tools.
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  role          TEXT NOT NULL DEFAULT 'patron'
                CHECK (role IN ('patron', 'artist', 'operator')),
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX users_role_idx ON users(role);

-- Magic-link tokens (signed JWTs in cookies; this table records issuance + use).
CREATE TABLE magic_links (
  token       TEXT PRIMARY KEY,
  email       TEXT NOT NULL COLLATE NOCASE,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at  TEXT NOT NULL,
  used_at     TEXT
);
CREATE INDEX magic_links_email_idx ON magic_links(email);

-- ── reference data: categories, saints, dioceses, orders ────────────
CREATE TABLE categories (
  slug         TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  short_name   TEXT NOT NULL,
  blurb        TEXT,
  pattern      TEXT,
  palette_from TEXT,
  palette_to   TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE saints (
  slug         TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  also         TEXT NOT NULL DEFAULT '[]',     -- JSON array
  feast_month  INTEGER NOT NULL CHECK (feast_month BETWEEN 1 AND 12),
  feast_day    INTEGER NOT NULL CHECK (feast_day BETWEEN 1 AND 31),
  patron_of    TEXT NOT NULL DEFAULT '[]',     -- JSON array
  blurb        TEXT,
  palette_from TEXT,
  palette_to   TEXT
);

CREATE TABLE dioceses (
  name        TEXT PRIMARY KEY,
  longitude   REAL NOT NULL,
  latitude    REAL NOT NULL
);

CREATE TABLE religious_orders (
  slug         TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  charism      TEXT,
  palette_from TEXT,
  palette_to   TEXT
);

-- ── artists + relations ─────────────────────────────────────────────
CREATE TABLE artists (
  id                     TEXT PRIMARY KEY,
  slug                   TEXT NOT NULL UNIQUE,
  user_id                TEXT REFERENCES users(id) ON DELETE SET NULL,
  honorific              TEXT,
  name                   TEXT NOT NULL,
  city                   TEXT NOT NULL,
  region                 TEXT NOT NULL,
  bio                    TEXT NOT NULL DEFAULT '[]',  -- JSON array of paragraphs
  portrait_from          TEXT,
  portrait_to            TEXT,
  accepting_commissions  INTEGER NOT NULL DEFAULT 1,
  years_practicing       INTEGER NOT NULL DEFAULT 0,
  starting_at            INTEGER NOT NULL DEFAULT 0,
  custom_pricing         INTEGER NOT NULL DEFAULT 1,
  diocese_name           TEXT REFERENCES dioceses(name),
  order_slug             TEXT REFERENCES religious_orders(slug),
  vocation_statement     TEXT,
  patron                 TEXT,                          -- patron saint, free text
  created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX artists_user_idx ON artists(user_id);
CREATE INDEX artists_diocese_idx ON artists(diocese_name);
CREATE INDEX artists_starting_at_idx ON artists(starting_at);

CREATE TABLE artist_categories (
  artist_id     TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL REFERENCES categories(slug) ON DELETE CASCADE,
  PRIMARY KEY (artist_id, category_slug)
);
CREATE INDEX artist_categories_category_idx ON artist_categories(category_slug);

CREATE TABLE artist_saints (
  artist_id  TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  saint_slug TEXT NOT NULL REFERENCES saints(slug) ON DELETE CASCADE,
  PRIMARY KEY (artist_id, saint_slug)
);

CREATE TABLE artist_tiers (
  id                     TEXT PRIMARY KEY,
  artist_id              TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  tier_id                TEXT NOT NULL,
  name                   TEXT NOT NULL,
  description            TEXT,
  starting_at            INTEGER NOT NULL,
  turnaround_weeks_min   INTEGER NOT NULL,
  turnaround_weeks_max   INTEGER NOT NULL,
  sort_order             INTEGER NOT NULL DEFAULT 0,
  UNIQUE (artist_id, tier_id)
);

CREATE TABLE artworks (
  id           TEXT PRIMARY KEY,
  artist_id    TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  year         INTEGER,
  medium       TEXT,
  dimensions   TEXT,
  caption      TEXT,
  pattern      TEXT,
  palette_from TEXT,
  palette_to   TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX artworks_artist_idx ON artworks(artist_id);

-- ── verifications (pastor + chancery endorsement) ───────────────────
CREATE TABLE verifications (
  id                              TEXT PRIMARY KEY,
  artist_id                       TEXT REFERENCES artists(id) ON DELETE CASCADE,
  token                           TEXT NOT NULL UNIQUE,
  chancery_token                  TEXT UNIQUE,
  status                          TEXT NOT NULL DEFAULT 'pending'
                                    CHECK (status IN (
                                      'pending', 'endorsed', 'endorsed-chancery-pending',
                                      'chancery-confirmed', 'declined', 'discuss',
                                      'expired', 'revoked'
                                    )),
  role                            TEXT NOT NULL CHECK (role IN ('pastor', 'chancery', 'religious-superior')),
  verifier_name                   TEXT NOT NULL,
  verifier_email                  TEXT NOT NULL COLLATE NOCASE,
  verifier_email_is_free_webmail  INTEGER NOT NULL DEFAULT 0,
  parish_or_community             TEXT NOT NULL,
  parish_website                  TEXT,
  diocese                         TEXT,
  chancery_email                  TEXT COLLATE NOCASE,
  notes                           TEXT,
  chancery_notes                  TEXT,
  created_at                      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  endorsed_at                     TEXT,
  chancery_confirmed_at           TEXT,
  expires_at                      TEXT
);
CREATE INDEX verifications_artist_idx ON verifications(artist_id);
CREATE INDEX verifications_status_idx ON verifications(status);

-- ── connect accounts (Stripe Connect — wiring later) ────────────────
CREATE TABLE connect_accounts (
  artist_id              TEXT PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,
  stripe_account_id      TEXT UNIQUE,
  status                 TEXT NOT NULL DEFAULT 'not-onboarded'
                           CHECK (status IN ('not-onboarded', 'onboarding', 'verified')),
  payout_account_bank    TEXT,
  payout_account_last4   TEXT,
  tax_form_status        TEXT NOT NULL DEFAULT 'missing'
                           CHECK (tax_form_status IN ('missing', 'pending', 'on-file')),
  started_at             TEXT,
  verified_at            TEXT,
  created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── commissions + escrow + messages + WIP + blessing + certificate ─
CREATE TABLE commissions (
  id                       TEXT PRIMARY KEY,
  artist_id                TEXT NOT NULL REFERENCES artists(id) ON DELETE RESTRICT,
  patron_id                TEXT REFERENCES users(id) ON DELETE SET NULL,
  patron_name              TEXT NOT NULL,
  patron_email             TEXT NOT NULL COLLATE NOCASE,
  category_slug            TEXT REFERENCES categories(slug),
  setting                  TEXT,
  scope                    TEXT NOT NULL,
  artist_quote_note        TEXT,
  artist_total_usd         INTEGER,
  platform_fee_pct         REAL NOT NULL DEFAULT 0.10,
  platform_fee_usd         INTEGER,
  total_due_usd            INTEGER,
  preferred_deadline       TEXT,
  feast_slug               TEXT,
  feast_name               TEXT,
  feast_date               TEXT,
  patron_saint             TEXT,
  diocese                  TEXT,
  parish_or_chapel         TEXT,
  ip_terms                 TEXT NOT NULL DEFAULT 'patron-exclusive'
                             CHECK (ip_terms IN ('patron-exclusive', 'shared-prints', 'artist-retains', 'shared-custom')),
  ip_custom_note           TEXT,
  stage                    TEXT NOT NULL DEFAULT 'scoping'
                             CHECK (stage IN ('scoping', 'awaiting-deposit', 'in-progress',
                                              'midpoint-review', 'final-review',
                                              'delivered', 'blessed', 'cancelled')),
  shipping_carrier         TEXT,
  shipping_tracking        TEXT,
  shipping_insured_for     INTEGER,
  shipping_shipped_at      TEXT,
  shipping_delivered_at    TEXT,
  shipping_notes           TEXT,
  blessing_recorded_at     TEXT,
  blessing_recorded_by     TEXT,
  blessing_parish_or_chapel TEXT,
  blessing_note            TEXT,
  certificate_issued_at    TEXT,
  certificate_serial       TEXT UNIQUE,
  certificate_title        TEXT,
  created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at             TEXT,
  cancelled_at             TEXT
);
CREATE INDEX commissions_artist_idx ON commissions(artist_id);
CREATE INDEX commissions_patron_idx ON commissions(patron_id);
CREATE INDEX commissions_stage_idx ON commissions(stage);
CREATE INDEX commissions_completed_idx ON commissions(completed_at DESC);

CREATE TABLE commission_escrow (
  id                       TEXT PRIMARY KEY,
  commission_id            TEXT NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  stage                    TEXT NOT NULL CHECK (stage IN ('deposit', 'midpoint', 'final')),
  label                    TEXT NOT NULL,
  pct                      REAL NOT NULL,
  amount_usd               INTEGER NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'unfunded'
                             CHECK (status IN ('unfunded', 'held', 'released', 'refunded')),
  funded_at                TEXT,
  released_at              TEXT,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id       TEXT,
  UNIQUE (commission_id, stage)
);
CREATE INDEX commission_escrow_status_idx ON commission_escrow(status);

CREATE TABLE commission_messages (
  id            TEXT PRIMARY KEY,
  commission_id TEXT NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  author_role   TEXT NOT NULL CHECK (author_role IN ('patron', 'artist', 'system')),
  author_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name   TEXT NOT NULL,
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX commission_messages_commission_idx ON commission_messages(commission_id, created_at);

CREATE TABLE commission_wip (
  id            TEXT PRIMARY KEY,
  commission_id TEXT NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  caption       TEXT NOT NULL,
  image_url     TEXT,                    -- R2 URL
  palette_from  TEXT,
  palette_to    TEXT,
  pattern       TEXT,
  posted_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX commission_wip_commission_idx ON commission_wip(commission_id, posted_at);

-- ── reviews ─────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id                 TEXT PRIMARY KEY,
  commission_id      TEXT NOT NULL UNIQUE REFERENCES commissions(id) ON DELETE CASCADE,
  artist_id          TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  patron_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
  patron_name        TEXT NOT NULL,
  rating             INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body               TEXT NOT NULL,
  artist_reply_body  TEXT,
  artist_reply_at    TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX reviews_artist_idx ON reviews(artist_id, created_at DESC);

-- ── disputes ────────────────────────────────────────────────────────
CREATE TABLE disputes (
  id                TEXT PRIMARY KEY,
  commission_id     TEXT NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  opened_by         TEXT NOT NULL CHECK (opened_by IN ('patron', 'artist')),
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'resolved-mediated', 'resolved-refund',
                                        'resolved-release', 'withdrawn')),
  opened_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_at       TEXT,
  resolution_note   TEXT,
  stripe_dispute_id TEXT UNIQUE
);
CREATE INDEX disputes_commission_idx ON disputes(commission_id);
CREATE INDEX disputes_status_idx ON disputes(status);

-- ── institutional intakes + proposals ───────────────────────────────
CREATE TABLE intakes (
  id                  TEXT PRIMARY KEY,
  kind                TEXT NOT NULL CHECK (kind IN ('diocese-bulk', 'parish-altar', 'religious-order', 'school', 'other-institution')),
  institution_name    TEXT NOT NULL,
  diocese             TEXT,
  contact_name        TEXT NOT NULL,
  contact_email       TEXT NOT NULL COLLATE NOCASE,
  contact_role        TEXT,
  title               TEXT NOT NULL,
  brief               TEXT NOT NULL,
  craft               TEXT,
  budget_total_usd    INTEGER,
  budget_per_work_usd INTEGER,
  quantity            INTEGER NOT NULL DEFAULT 1,
  preferred_delivery  TEXT,
  feast_slug          TEXT,
  feast_name          TEXT,
  feast_date          TEXT,
  invoicing_terms     TEXT NOT NULL DEFAULT 'net-30'
                        CHECK (invoicing_terms IN ('stripe-immediate', 'net-30', 'net-60', 'purchase-order')),
  po_number           TEXT,
  status              TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('draft', 'open', 'shortlisting', 'awarded', 'closed')),
  awarded_proposal_id TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX intakes_status_idx ON intakes(status);

CREATE TABLE intake_approvals (
  id          TEXT PRIMARY KEY,
  intake_id   TEXT NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  name        TEXT,
  email       TEXT COLLATE NOCASE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'declined')),
  decided_at  TEXT,
  note        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX intake_approvals_intake_idx ON intake_approvals(intake_id);

CREATE TABLE proposals (
  id                 TEXT PRIMARY KEY,
  intake_id          TEXT NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  artist_id          TEXT NOT NULL REFERENCES artists(id) ON DELETE RESTRICT,
  price_per_work_usd INTEGER NOT NULL,
  total_price_usd    INTEGER NOT NULL,
  estimated_weeks    INTEGER NOT NULL,
  pitch_body         TEXT NOT NULL,
  palette_from       TEXT,
  palette_to         TEXT,
  status             TEXT NOT NULL DEFAULT 'submitted'
                       CHECK (status IN ('submitted', 'shortlisted', 'awarded', 'declined', 'withdrawn')),
  submitted_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  decided_at         TEXT
);
CREATE INDEX proposals_intake_idx ON proposals(intake_id);
CREATE INDEX proposals_artist_idx ON proposals(artist_id);

CREATE TABLE intake_commissions (
  intake_id     TEXT NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  commission_id TEXT NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  PRIMARY KEY (intake_id, commission_id)
);

-- ── artist availability ─────────────────────────────────────────────
CREATE TABLE artist_availability (
  artist_id      TEXT PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,
  concurrent_cap INTEGER,
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE artist_availability_months (
  artist_id  TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  month_key  TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('accepting', 'full', 'away')),
  PRIMARY KEY (artist_id, month_key)
);

-- ── apprenticeship applications ─────────────────────────────────────
CREATE TABLE apprenticeships (
  id                  TEXT PRIMARY KEY,
  applicant_name      TEXT NOT NULL,
  applicant_email     TEXT NOT NULL COLLATE NOCASE,
  applicant_age       INTEGER,
  craft               TEXT REFERENCES categories(slug),
  desired_master_id   TEXT REFERENCES artists(id) ON DELETE SET NULL,
  parish_or_community TEXT,
  pastor_email        TEXT COLLATE NOCASE,
  portfolio_url       TEXT,
  letter              TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('submitted', 'shortlisted', 'interviewed', 'offered', 'declined', 'matched')),
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── moderation ──────────────────────────────────────────────────────
CREATE TABLE commission_flags (
  commission_id  TEXT PRIMARY KEY REFERENCES commissions(id) ON DELETE CASCADE,
  reason         TEXT NOT NULL CHECK (reason IN ('ai-generated', 'inappropriate', 'fraud', 'quality', 'other')),
  note           TEXT,
  flagged_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  flagged_by     TEXT NOT NULL CHECK (flagged_by IN ('operator', 'patron', 'artist'))
);

CREATE TABLE artist_suspensions (
  id            TEXT PRIMARY KEY,
  artist_id     TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  suspended_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  lifted_at     TEXT
);
CREATE INDEX artist_suspensions_active_idx ON artist_suspensions(artist_id) WHERE lifted_at IS NULL;

-- ── email preferences ──────────────────────────────────────────────
CREATE TABLE email_preferences (
  email             TEXT PRIMARY KEY COLLATE NOCASE,
  unsubscribe_all   INTEGER NOT NULL DEFAULT 0,
  milestone         INTEGER NOT NULL DEFAULT 1,
  digest            INTEGER NOT NULL DEFAULT 1,
  marketing         INTEGER NOT NULL DEFAULT 1,
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── outbox (audit log of every email we send) ──────────────────────
CREATE TABLE outbox (
  id              TEXT PRIMARY KEY,
  event_kind      TEXT NOT NULL,
  event_payload   TEXT NOT NULL,                -- JSON
  category        TEXT NOT NULL CHECK (category IN ('transactional', 'milestone', 'digest', 'marketing')),
  subject         TEXT NOT NULL,
  preheader       TEXT,
  recipients      TEXT NOT NULL,                -- JSON
  rendered_html   TEXT NOT NULL,
  rendered_text   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'sent', 'failed', 'skipped-unsubscribed')),
  resend_id       TEXT,
  failure_reason  TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  sent_at         TEXT
);
CREATE INDEX outbox_status_idx ON outbox(status, created_at DESC);
CREATE INDEX outbox_category_idx ON outbox(category, created_at DESC);

-- ── full-text search via FTS5 ──────────────────────────────────────
-- Searchable artists: name, honorific, city, region, bio.
-- We populate the FTS table via triggers below.
CREATE VIRTUAL TABLE artists_fts USING fts5(
  name,
  honorific,
  city,
  region,
  bio,
  content='artists',
  content_rowid='rowid'
);

-- Triggers to keep artists_fts in sync with artists.
CREATE TRIGGER artists_ai AFTER INSERT ON artists BEGIN
  INSERT INTO artists_fts(rowid, name, honorific, city, region, bio)
  VALUES (new.rowid, new.name, COALESCE(new.honorific, ''), new.city, new.region, new.bio);
END;
CREATE TRIGGER artists_ad AFTER DELETE ON artists BEGIN
  INSERT INTO artists_fts(artists_fts, rowid, name, honorific, city, region, bio)
  VALUES ('delete', old.rowid, old.name, COALESCE(old.honorific, ''), old.city, old.region, old.bio);
END;
CREATE TRIGGER artists_au AFTER UPDATE ON artists BEGIN
  INSERT INTO artists_fts(artists_fts, rowid, name, honorific, city, region, bio)
  VALUES ('delete', old.rowid, old.name, COALESCE(old.honorific, ''), old.city, old.region, old.bio);
  INSERT INTO artists_fts(rowid, name, honorific, city, region, bio)
  VALUES (new.rowid, new.name, COALESCE(new.honorific, ''), new.city, new.region, new.bio);
END;
