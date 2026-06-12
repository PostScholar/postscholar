-- Extend mentions to cover comment appreciations (+) as well as @mentions.
ALTER TABLE mentions
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'mention';

ALTER TABLE mentions
  DROP CONSTRAINT IF EXISTS mentions_type_check;

ALTER TABLE mentions
  ADD CONSTRAINT mentions_type_check
  CHECK (type IN ('mention', 'appreciation'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_mentions_appreciation_unique
  ON mentions (comment_id, mentioning_user_id, mentioned_user_id)
  WHERE type = 'appreciation';
