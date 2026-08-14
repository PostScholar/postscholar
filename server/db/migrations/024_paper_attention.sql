-- Off-platform attention signals (HN, Reddit) for "worth discussing" pipeline.
-- Written by external-discourse-data worker; read by GET /explore/noted (main repo).

CREATE TABLE IF NOT EXISTS paper_attention_signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL CHECK (source IN ('hn', 'reddit')),
  source_id     TEXT NOT NULL,
  source_url    TEXT,
  thread_title  TEXT,
  doi           TEXT NOT NULL,
  points        INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  posted_at     TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_paper_attention_signals_doi ON paper_attention_signals(doi);
CREATE INDEX IF NOT EXISTS idx_paper_attention_signals_last_seen ON paper_attention_signals(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS paper_attention_summary (
  doi               TEXT PRIMARY KEY,
  attention_rank    NUMERIC NOT NULL DEFAULT 0,
  hn_signal_count   INTEGER NOT NULL DEFAULT 0,
  reddit_signal_count INTEGER NOT NULL DEFAULT 0,
  best_thread_title TEXT,
  max_points        INTEGER NOT NULL DEFAULT 0,
  max_comments      INTEGER NOT NULL DEFAULT 0,
  last_activity_at  TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paper_attention_summary_rank ON paper_attention_summary(attention_rank DESC);
