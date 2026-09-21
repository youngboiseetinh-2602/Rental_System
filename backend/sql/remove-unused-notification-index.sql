-- Apply once to an existing database created with the old entity mapping.
-- Keep idx_notification_receiver_id: it supports receiver lookups and the FK.
-- Removing @Index from the entity does not remove an existing database index.
ALTER TABLE notification DROP INDEX idx_notification_receiver_status_sent_at;
