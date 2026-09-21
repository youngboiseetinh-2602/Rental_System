package com.javaweb.repository;

import com.javaweb.entity.NotificationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    @Query("""
            SELECT n FROM NotificationEntity n
            LEFT JOIN n.receiver receiver
            WHERE n.receiver IS NULL OR receiver.id = :receiverId
            ORDER BY n.sentAt DESC, n.id DESC
            """)
    List<NotificationEntity> findAllByReceiverIsNullOrReceiver_IdOrderBySentAtDescIdDesc(
            @Param("receiverId") Long receiverId);

    @Query("""
            SELECT n FROM NotificationEntity n
            WHERE n.sender.id = :senderId AND n.receiver IS NULL
            ORDER BY n.sentAt DESC, n.id DESC
            """)
    List<NotificationEntity> findAllBySender_IdAndReceiverIsNullOrderBySentAtDescIdDesc(
            @Param("senderId") Long senderId);
}
