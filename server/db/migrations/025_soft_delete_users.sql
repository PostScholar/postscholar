-- 025_soft_delete_users.sql
-- Add soft delete support for user accounts

ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user account was soft-deleted. NULL = active account.';
