-- Refactor a role-specific owner/customer conversation into a generic
-- two-participant conversation while preserving existing rows.

ALTER TABLE conversation
    MODIFY COLUMN status
        ENUM('READ', 'UNREAD', 'ACTIVE', 'BLOCKED')
        NOT NULL DEFAULT 'READ';

UPDATE conversation
SET status = 'ACTIVE'
WHERE status IN ('READ', 'UNREAD');

ALTER TABLE conversation
    MODIFY COLUMN status
        ENUM('ACTIVE', 'BLOCKED')
        NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE conversation
    DROP FOREIGN KEY fk_conversation_owner,
    DROP FOREIGN KEY fk_conversation_customer,
    DROP INDEX uq_conversation_owner_customer;

ALTER TABLE conversation
    RENAME COLUMN ownerId TO participantOneId,
    RENAME COLUMN customerId TO participantTwoId;

ALTER TABLE conversation
    ADD COLUMN normalizedParticipantOneId BIGINT NULL,
    ADD COLUMN normalizedParticipantTwoId BIGINT NULL;

UPDATE conversation
SET normalizedParticipantOneId = LEAST(participantOneId, participantTwoId),
    normalizedParticipantTwoId = GREATEST(participantOneId, participantTwoId);

UPDATE conversation
SET participantOneId = normalizedParticipantOneId,
    participantTwoId = normalizedParticipantTwoId;

ALTER TABLE conversation
    DROP COLUMN normalizedParticipantOneId,
    DROP COLUMN normalizedParticipantTwoId,
    ADD COLUMN blockedById BIGINT NULL,
    ADD CONSTRAINT uq_conversation_participant_pair
        UNIQUE (participantOneId, participantTwoId),
    ADD INDEX idx_conversation_participant_two (participantTwoId),
    ADD INDEX idx_conversation_blocked_by (blockedById),
    ADD CONSTRAINT fk_conversation_participant_one
        FOREIGN KEY (participantOneId) REFERENCES users (id),
    ADD CONSTRAINT fk_conversation_participant_two
        FOREIGN KEY (participantTwoId) REFERENCES users (id),
    ADD CONSTRAINT fk_conversation_blocked_by
        FOREIGN KEY (blockedById) REFERENCES users (id),
    ADD CONSTRAINT chk_conversation_participant_order
        CHECK (participantOneId < participantTwoId);

ALTER TABLE message
    MODIFY COLUMN status
        ENUM('READ', 'UNREAD', 'SENT')
        NOT NULL DEFAULT 'UNREAD';

UPDATE message
SET status = 'SENT'
WHERE status = 'UNREAD';

ALTER TABLE message
    MODIFY COLUMN status
        ENUM('SENT', 'READ')
        NOT NULL DEFAULT 'SENT',
    MODIFY COLUMN sentAt
        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN note VARCHAR(255) NULL,
    ADD INDEX idx_message_conversation_hidden_id
        (conversationId, hidden, id);
