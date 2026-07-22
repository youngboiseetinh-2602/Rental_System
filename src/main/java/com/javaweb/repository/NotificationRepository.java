package com.javaweb.repository;

import com.javaweb.entity.NotificationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    List<NotificationEntity> findAllByReceiver_Id(Long receiverId);
}
