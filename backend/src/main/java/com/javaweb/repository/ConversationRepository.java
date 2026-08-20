package com.javaweb.repository;

import com.javaweb.entity.ConversationEntity;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {

    Optional<ConversationEntity> findByParticipantOne_IdAndParticipantTwo_Id(
            Long participantOneId,
            Long participantTwoId
    );

    @Query("""
            SELECT conversation
            FROM ConversationEntity conversation
            WHERE conversation.participantOne.id = :userId
               OR conversation.participantTwo.id = :userId
            ORDER BY COALESCE((
                SELECT MAX(message.sentAt)
                FROM MessageEntity message
                WHERE message.conversation = conversation
                  AND message.hidden = false
            ), conversation.createdAt) DESC, conversation.id DESC
            """)
    java.util.List<ConversationEntity> findFirstByParticipantId(
            @Param("userId") Long userId,
            Pageable pageable
    );

    @Query("""
            SELECT conversation
            FROM ConversationEntity conversation
            WHERE (conversation.participantOne.id = :userId
                OR conversation.participantTwo.id = :userId)
              AND (COALESCE((
                    SELECT MAX(message.sentAt) FROM MessageEntity message
                    WHERE message.conversation = conversation AND message.hidden = false
                  ), conversation.createdAt) < :cursorAt
                OR (COALESCE((
                    SELECT MAX(message.sentAt) FROM MessageEntity message
                    WHERE message.conversation = conversation AND message.hidden = false
                  ), conversation.createdAt) = :cursorAt
                  AND conversation.id < :cursorId))
            ORDER BY COALESCE((
                SELECT MAX(message.sentAt) FROM MessageEntity message
                WHERE message.conversation = conversation AND message.hidden = false
            ), conversation.createdAt) DESC, conversation.id DESC
            """)
    java.util.List<ConversationEntity> findAfterCursorByParticipantId(
            @Param("userId") Long userId,
            @Param("cursorAt") java.time.LocalDateTime cursorAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

}
