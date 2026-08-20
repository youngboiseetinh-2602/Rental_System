package com.javaweb.repository;

import com.javaweb.entity.MessageEntity;
import com.javaweb.enums.MessageStatus;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    long countByConversation_IdAndSender_IdNotAndStatusAndHiddenFalse(
            Long conversationId,
            Long readerId,
            MessageStatus status
    );

    Slice<MessageEntity> findAllByConversation_IdOrderByIdDesc(
            Long conversationId,
            Pageable pageable
    );

    Optional<MessageEntity> findFirstByConversation_IdAndHiddenFalseOrderByIdDesc(
            Long conversationId
    );

    Slice<MessageEntity> findAllByConversation_IdAndIdLessThanOrderByIdDesc(
            Long conversationId,
            Long beforeId,
            Pageable pageable
    );

    @Modifying
    @Query("""
            UPDATE MessageEntity message
            SET message.status = com.javaweb.enums.MessageStatus.READ
            WHERE message.conversation.id = :conversationId
              AND message.sender.id <> :readerId
              AND message.status = com.javaweb.enums.MessageStatus.SENT
              AND message.hidden = false
            """)
    int markReceivedMessagesAsRead(
            @Param("conversationId") Long conversationId,
            @Param("readerId") Long readerId
    );
}
