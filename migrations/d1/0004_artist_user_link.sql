-- Wire artists to their sign-in email so magic-link consumption can
-- auto-link `artists.user_id = users.id` on the artist's first sign-in.
-- Without this, an artist signs in via magic link but their user row is
-- never connected to their artist row, so they don't see their own
-- commissions in the dashboard.
--
-- Operator workflow:
--   1. POST /api/artists/:slug/claim { email } sets artists.user_email
--   2. Artist visits /signin, requests a magic link with that email
--   3. /verify consumes the link → creates the user → auto-links the
--      artist row in the same transaction
--   4. Artist's dashboard now shows their commissions

ALTER TABLE artists ADD COLUMN user_email TEXT COLLATE NOCASE;
CREATE INDEX IF NOT EXISTS artists_user_email_idx ON artists(user_email);
