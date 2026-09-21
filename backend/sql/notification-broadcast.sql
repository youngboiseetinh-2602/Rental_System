-- Run against an existing database before deploying the broadcast change.
-- Existing per-recipient notifications remain unchanged.
ALTER TABLE notification MODIFY COLUMN receiverId BIGINT NULL;
