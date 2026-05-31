-- 004_comments_depth_search.sql

ALTER TABLE comments ADD COLUMN depth INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_comments_body_fts ON comments USING GIN (to_tsvector('english', body));
CREATE INDEX idx_comments_depth ON comments (depth);
