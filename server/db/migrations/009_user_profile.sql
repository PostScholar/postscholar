ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_visibility JSONB NOT NULL DEFAULT '{"bio":true,"joined_date":true,"activity":true}';
