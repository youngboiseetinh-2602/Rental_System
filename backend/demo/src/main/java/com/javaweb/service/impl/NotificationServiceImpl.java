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
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.NotificationService;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationConverter notificationConverter;
    private final CurrentUserContext currentUserContext;

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public NotificationResponse createNotification(Long senderId, NotificationRequest request) {
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người gửi: " + senderId));

        return saveNotification(sender, request);
    }

    @Override
    @Transactional
    public NotificationResponse createSystemNotification(NotificationRequest request) {
        return saveNotification(null, request);
    }

    private NotificationResponse saveNotification(
            UserEntity sender, NotificationRequest request) {
        Long receiverId = request.getReceiverId();
        UserEntity receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người nhận: " + receiverId));

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
    @PreAuthorize(AuthorizationRules.USER)
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications() {
        Long userId = currentUserContext.getCurrentUserId();
        userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người dùng: " + userId));
        List<NotificationEntity> notificationEntities =
                notificationRepository.findAllByReceiver_Id(userId);

        if (notificationEntities.isEmpty()) {
            throw new DataNotFoundException("No notifications found " );
        }

        List<NotificationResponse> results = new ArrayList<>();

        for (NotificationEntity notificationEntity : notificationEntities) {
            results.add(notificationConverter.toResponse(notificationEntity));
        }

        return results;
    }

    @Override
    @PreAuthorize(AuthorizationRules.USER)
    @Transactional
    public String readNotification(Long notificationId) {
        Long userId = currentUserContext.getCurrentUserId();
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy thông báo"));
        if (!notification.getReceiver().getId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền đọc thông báo này");
        }
        if (notification.getStatus() == NotificationStatus.UNREAD) {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(
                    LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
            notificationRepository.save(notification);
        }
        return "đã đọc";
    }

}
