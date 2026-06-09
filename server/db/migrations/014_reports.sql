-- Moderation/reporting system
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'offtopic', 'misinformation', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (comment_id IS NOT NULL OR discussion_id IS NOT NULL)
);

-- Indexes for moderation dashboard
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_comment ON reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_reports_discussion ON reports(discussion_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
