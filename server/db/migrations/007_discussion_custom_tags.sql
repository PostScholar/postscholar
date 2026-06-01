-- 007_discussion_custom_tags.sql
-- Adds a custom_tags JSONB column to discussions.
-- Stores free-text tags entered by the user when starting a discussion,
-- in addition to the predefined topic taxonomy.
-- Stored as a JSON array of strings e.g. ["deep learning", "transformer"].

ALTER TABLE discussions ADD COLUMN custom_tags JSONB NOT NULL DEFAULT '[]';
