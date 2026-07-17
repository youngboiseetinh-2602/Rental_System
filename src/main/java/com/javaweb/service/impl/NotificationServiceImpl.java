package com.javaweb.service.impl;

import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.converter.NotificationConverter;
import com.javaweb.entity.NotificationEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.NotificationStatus;
import com.javaweb.model.request.NotificationRequest;
import com.javaweb.model.response.NotificationResponse;
import com.javaweb.repository.NotificationRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.service.NotificationService;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationConverter notificationConverter;

    @Override
    @Transactional
    public NotificationResponse createNotification(Long senderId, NotificationRequest request) {
        UserEntity sender = getUser(senderId, "Sender");
        UserEntity receiver = getUser(request.getReceiverId(), "Receiver");

        NotificationEntity notification = new NotificationEntity();
        notification.setSender(sender);
        notification.setReceiver(receiver);
        notification.setTitle(request.getTitle());
        notification.setContent(request.getContent());
        notification.setStatus(NotificationStatus.UNREAD);
        notificationRepository.save(notification);

        return notificationConverter.toResponse(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean notificationExists(Long receiverId, String title, String content) {
        return notificationRepository.existsByReceiver_IdAndTitleAndContent(
                receiverId, title, content);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        getUser(userId, "User");
        List<NotificationEntity> notifications =
                notificationRepository.findAllByReceiver_Id(userId);

        if (notifications.isEmpty()) {
            throw new DataNotFoundException("No notifications found " );
        }

        List<NotificationResponse> responses = new ArrayList<>();

        for (NotificationEntity notification : notifications) {
            responses.add(notificationConverter.toResponse(notification));
        }

        return responses;
    }

    @Override
    @Transactional
    public String readNotification(Long userId, Long notificationId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Notification not found: " + notificationId));

        if (!notification.getReceiver().getId().equals(userId)) {
            throw new ForbiddenException("You are not allowed to read this notification");
        }

        if (notification.getStatus() == NotificationStatus.UNREAD) {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(
                    LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
            notificationRepository.save(notification);
        }

        return "read";
    }

    private UserEntity getUser(Long userId, String type) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException(
                        type + " not found: " + userId));
    }
}
