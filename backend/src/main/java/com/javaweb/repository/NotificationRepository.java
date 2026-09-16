package com.javaweb.repository;

import com.javaweb.entity.NotificationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    List<NotificationEntity> findAllByReceiver_Id(Long receiverId);

    @Query("""
            select n from NotificationEntity n
            where n.sender.id = :senderId and (
                (n.dispatchId is null and n.receiver.id = :senderId)
                or (n.dispatchId is not null and n.id = (
                    select min(copy.id) from NotificationEntity copy
                    where copy.dispatchId = n.dispatchId and copy.sender.id = :senderId
                ))
            ) order by n.sentAt desc, n.id desc
            """)
    List<NotificationEntity> findSentHistory(@Param("senderId") Long senderId);
}
