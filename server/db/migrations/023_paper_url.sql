-- Optional external link for manually entered papers (arXiv, publisher page, etc.)

ALTER TABLE papers ADD COLUMN IF NOT EXISTS paper_url TEXT;
