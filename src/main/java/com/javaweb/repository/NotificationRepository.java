package com.javaweb.repository;

import com.javaweb.entity.NotificationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    boolean existsByReceiver_IdAndTitleAndContent(
            Long receiverId,
            String title,
            String content
    );

    List<NotificationEntity> findAllByReceiver_Id(Long receiverId);
}
