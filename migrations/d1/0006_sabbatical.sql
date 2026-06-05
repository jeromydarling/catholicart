-- Sabbatical mode. When sabbatical_until is set and in the future,
-- the artist is on retreat — the public profile shows the return
-- date, the commission CTA is replaced with "leave a note for when
-- they return," and no responsiveness clock runs against them.
ALTER TABLE artists ADD COLUMN sabbatical_until TEXT;
