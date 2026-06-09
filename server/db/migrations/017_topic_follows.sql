CREATE TABLE IF NOT EXISTS topic_follows (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_topic_follows_user ON topic_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_follows_topic ON topic_follows(topic);
