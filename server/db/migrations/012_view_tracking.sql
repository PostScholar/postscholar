-- Track discussion views for analytics
CREATE TABLE IF NOT EXISTS discussion_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_hash TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_discussion_views_discussion ON discussion_views(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_views_user ON discussion_views(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_views_viewed ON discussion_views(viewed_at DESC);
