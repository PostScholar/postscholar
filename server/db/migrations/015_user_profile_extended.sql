-- Extended user profile fields for academic information
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_scholar_url TEXT;
-- orcid_id might already exist from earlier migrations
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_id TEXT;
