-- Honest-scaffold batch — no more "external dependency" hand-waving.
--
-- 1. working_toward_feasts on artists (F4): JSON array of feast slugs
--    the artist accepts work for in the current liturgical year.
-- 2. letter_public + share_token on commissions: opt-in letter
--    archive (F17) + private-share read-only link (F12).
-- 3. artist_open_hours + studio_visits: studio visit booking (F13).

ALTER TABLE artists ADD COLUMN working_toward_feasts TEXT NOT NULL DEFAULT '[]';
ALTER TABLE commissions ADD COLUMN letter_public INTEGER NOT NULL DEFAULT 0;
ALTER TABLE commissions ADD COLUMN share_token TEXT;
CREATE INDEX IF NOT EXISTS commissions_share_token_idx ON commissions(share_token) WHERE share_token IS NOT NULL;

CREATE TABLE artist_open_hours (
  id           TEXT PRIMARY KEY,
  artist_id    TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  weekday      INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minute INTEGER NOT NULL CHECK (start_minute BETWEEN 0 AND 1440),
  end_minute   INTEGER NOT NULL CHECK (end_minute BETWEEN 0 AND 1440),
  timezone     TEXT NOT NULL DEFAULT 'UTC',
  active       INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS artist_open_hours_artist_idx ON artist_open_hours(artist_id);

CREATE TABLE studio_visits (
  id              TEXT PRIMARY KEY,
  artist_id       TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  patron_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  patron_email    TEXT NOT NULL,
  patron_name     TEXT NOT NULL,
  scheduled_at    TEXT NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 20,
  note            TEXT,
  status          TEXT NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested', 'confirmed', 'declined', 'completed', 'cancelled')),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS studio_visits_artist_idx ON studio_visits(artist_id, scheduled_at);
