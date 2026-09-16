-- Manual alternative ONLY when JPA_DDL_AUTO is not update.
-- Check SHOW COLUMNS FROM notification and SHOW INDEX FROM notification first.
-- Run only statements for columns/indexes that do not already exist.
-- Hibernate's configured ddl-auto=update adds these automatically on startup.
ALTER TABLE notification ADD COLUMN dispatchId VARCHAR(36) NULL;
ALTER TABLE notification ADD COLUMN audience VARCHAR(20) NULL;
CREATE INDEX idx_notification_dispatch ON notification (dispatchId, senderId, id);
-- Existing rows stay NULL: sent history retains the legacy sender's own copy.
