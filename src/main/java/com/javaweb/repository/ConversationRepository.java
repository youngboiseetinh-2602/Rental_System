package com.javaweb.repository;

import com.javaweb.entity.ConversationEntity;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {

    Optional<ConversationEntity> findByParticipantOne_IdAndParticipantTwo_Id(
            Long participantOneId,
            Long participantTwoId
    );

    @Query(value = """
            SELECT conversation
            FROM ConversationEntity conversation
            WHERE conversation.participantOne.id = :userId
               OR conversation.participantTwo.id = :userId
            ORDER BY (
                SELECT MAX(message.sentAt)
                FROM MessageEntity message
                WHERE message.conversation = conversation
            ) DESC, conversation.createdAt DESC
            """, countQuery = """
            SELECT COUNT(conversation)
            FROM ConversationEntity conversation
            WHERE conversation.participantOne.id = :userId
               OR conversation.participantTwo.id = :userId
            """)
    Page<ConversationEntity> findAllByParticipantId(
            @Param("userId") Long userId,
            Pageable pageable
    );

}
