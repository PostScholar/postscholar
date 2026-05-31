
CREATE TABLE papers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doi          TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  authors_json JSONB NOT NULL DEFAULT '[]',
  journal      TEXT,
  year         INTEGER,
  abstract     TEXT,
  source       TEXT NOT NULL CHECK (source IN ('crossref', 'manual')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE discussions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id   UUID NOT NULL UNIQUE REFERENCES papers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id     UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body              TEXT NOT NULL CHECK (length(body) > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_discussion_id ON comments(discussion_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
