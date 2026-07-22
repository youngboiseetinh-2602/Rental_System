package com.javaweb.repository;

import com.javaweb.entity.ConversationEntity;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {

    Optional<ConversationEntity> findByOwner_IdAndCustomer_Id(
            Long ownerId,
            Long customerId
    );

    Page<ConversationEntity> findAllByOwner_IdOrCustomer_Id(
            Long ownerId,
            Long customerId,
            Pageable pageable
    );

    @Query(value = """
            SELECT conversation
            FROM ConversationEntity conversation
            WHERE conversation.owner.id = :userId
               OR conversation.customer.id = :userId
            ORDER BY (
                SELECT MAX(message.sentAt)
                FROM MessageEntity message
                WHERE message.conversation = conversation
            ) DESC, conversation.createdAt DESC
            """, countQuery = """
            SELECT COUNT(conversation)
            FROM ConversationEntity conversation
            WHERE conversation.owner.id = :userId
               OR conversation.customer.id = :userId
            """)
    Page<ConversationEntity> findAllByParticipantId(
            @Param("userId") Long userId,
            Pageable pageable
    );

}
