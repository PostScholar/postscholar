-- 005_author_verifications.sql
-- Stores verified author badge records.
-- One record per user per discussion — a user can only verify once per paper.
-- orcid_id is the user's ORCID iD (e.g. 0000-0002-1825-0097).
-- Verification is per-discussion only — verifying on paper A does not
-- grant a badge on paper B.

CREATE TABLE author_verifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  orcid_id      TEXT NOT NULL,
  verified_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, discussion_id)
);

CREATE INDEX idx_author_verifications_discussion_id ON author_verifications(discussion_id);
CREATE INDEX idx_author_verifications_user_id ON author_verifications(user_id);