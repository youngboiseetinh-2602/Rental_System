package com.javaweb.repository;

import com.javaweb.entity.NotificationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    List<NotificationEntity> findAllByReceiver_Id(Long receiverId);

    // Each broadcast includes exactly one copy addressed to its sender.
    List<NotificationEntity> findAllBySender_IdAndReceiver_IdOrderBySentAtDescIdDesc(
            Long senderId, Long receiverId);
}
