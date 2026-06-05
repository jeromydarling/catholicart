-- Vocation site — JP2 Letter to Artists questionnaire + AI-synthesized
-- public profile. The artist answers 10 questions about their call,
-- their lineage, their materials, their rhythm. Workers AI (Llama,
-- free) gently synthesizes those answers into a mission statement,
-- studio rhythm, and process note. The artist edits any of it.
-- Their answers are kept so we can re-synthesize later without
-- asking them again.

-- New profile fields on artists. All nullable — the existing seed
-- artists keep working until each one fills in their questionnaire.
ALTER TABLE artists ADD COLUMN mission_statement TEXT;
ALTER TABLE artists ADD COLUMN studio_rhythm TEXT;
ALTER TABLE artists ADD COLUMN process_note TEXT;
ALTER TABLE artists ADD COLUMN instagram_handle TEXT;
ALTER TABLE artists ADD COLUMN x_handle TEXT;
ALTER TABLE artists ADD COLUMN personal_url TEXT;
ALTER TABLE artists ADD COLUMN profile_published INTEGER NOT NULL DEFAULT 0;

-- The raw questionnaire responses. Keeping these means we can
-- re-synthesize (e.g. with a tuned prompt) without re-asking the
-- artist, and we never lose their actual words to an LLM rewrite.
CREATE TABLE artist_questionnaire (
  artist_id        TEXT PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,

  -- The ten questions, drawn from JP2's Letter to Artists (1999):
  q1_first_call    TEXT,  -- The first work that called you
  q2_lineage       TEXT,  -- Who taught you; where you trained
  q3_canon         TEXT,  -- What tradition you work in
  q4_patron_saints TEXT,  -- Saints who accompany the work
  q5_rhythm        TEXT,  -- What carries the day (Hours, fasts, light)
  q6_materials     TEXT,  -- What you work with
  q7_for_parish    TEXT,  -- What you offer to the Church
  q8_for_home      TEXT,  -- What you offer to the household
  q9_the_cost      TEXT,  -- The discipline that hurts
  q10_the_prayer   TEXT,  -- What you pray over the work you deliver

  submitted_at     TEXT,
  ai_generated_at  TEXT,
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
