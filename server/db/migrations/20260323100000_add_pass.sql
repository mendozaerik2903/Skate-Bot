-- migrate:up
-- Add a password column for users since we are doing our own auth
ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL;
--migrate:down
ALTER TABLE users DROP COLUMN password_hash;