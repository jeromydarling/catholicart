-- Lineage scaffolding — master/apprentice + house artist relationships.
-- Patron families are computed at read time (GROUP BY patron_email
-- on commissions), no schema needed for that.

-- Free-text "trained under" + optional slug pointer to a guild artist.
-- If trained_under_slug is set, render trained_under as a link.
ALTER TABLE artists ADD COLUMN trained_under TEXT;
ALTER TABLE artists ADD COLUMN trained_under_slug TEXT REFERENCES artists(slug) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS artists_trained_under_idx ON artists(trained_under_slug);

-- House artists: a patron-artist relationship that means the patron
-- considers this artist their "household artist". Surfaced on the
-- artist's profile (anonymized) and in the patron's dashboard.
CREATE TABLE house_artists (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id  TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  since      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, artist_id)
);
CREATE INDEX IF NOT EXISTS house_artists_artist_idx ON house_artists(artist_id);
