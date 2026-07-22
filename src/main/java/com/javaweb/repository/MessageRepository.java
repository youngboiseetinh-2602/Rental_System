package com.javaweb.repository;

import com.javaweb.entity.MessageEntity;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    Page<MessageEntity> findAllByConversation_IdOrderBySentAtDesc(
            Long conversationId,
            Pageable pageable
    );

    Optional<MessageEntity> findFirstByConversation_IdOrderBySentAtDesc(
            Long conversationId
    );
}
