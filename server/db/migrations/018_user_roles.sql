ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'moderator', 'admin'));

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
