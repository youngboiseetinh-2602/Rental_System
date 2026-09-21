package com.javaweb.service.impl;

import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.converter.NotificationConverter;
import com.javaweb.entity.NotificationEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.NotificationStatus;
import com.javaweb.enums.ContractStatus;
import com.javaweb.model.request.NotificationRequest;
import com.javaweb.model.response.NotificationResponse;
import com.javaweb.repository.NotificationRepository;
import com.javaweb.repository.ContractRepository;
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
    private final ContractRepository contractRepository;
    private final NotificationConverter notificationConverter;
    private final CurrentUserContext currentUserContext;

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional
    public String sendNotificationToAll(NotificationRequest request) {
        Long senderId = currentUserContext.getCurrentUserId();
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new DataNotFoundException("Sender not found: " + senderId));
        saveNotification(sender, null, request);
        return "Gửi thông báo thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public NotificationResponse createNotification(Long receiverId, NotificationRequest request) {
        validateReceiverId(receiverId);
        Long senderId = currentUserContext.getCurrentUserId();
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người gửi: " + senderId));

        return saveNotification(sender, receiverId, request);
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER)
    @Transactional
    public NotificationResponse createOwnerNotification(Long receiverId, NotificationRequest request) {
        validateReceiverId(receiverId);
        Long senderId = currentUserContext.getCurrentUserId();
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người gửi: " + senderId));

        boolean isOwnerTenant = contractRepository
                .existsByTenant_IdAndRoom_RoomType_RentalProperty_Owner_IdAndStatusIn(
                        receiverId,
                        senderId,
                        List.of(
                                ContractStatus.APPROVED,
                                ContractStatus.TERMINATED,
                                ContractStatus.EXPIRED));
        if (!isOwnerTenant) {
            throw new ForbiddenException(
                    "Bạn chỉ có thể gửi thông báo cho người thuê của mình");
        }

        return saveNotification(sender, receiverId, request);
    }

    @Override
    @Transactional
    public NotificationResponse createSystemNotification(Long receiverId, NotificationRequest request) {
        validateReceiverId(receiverId);
        return saveNotification(null, receiverId, request);
    }

    private void validateReceiverId(Long receiverId) {
        if (receiverId == null || receiverId <= 0) {
            throw new IllegalArgumentException("Receiver id must be positive");
        }
    }

    private NotificationResponse saveNotification(
            UserEntity sender, Long receiverId, NotificationRequest request) {
        if (receiverId != null) {
            validateReceiverId(receiverId);
        }
        UserEntity receiver = receiverId == null ? null : userRepository.findById(receiverId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người nhận: " + receiverId));

        NotificationEntity notification = new NotificationEntity();
        notification.setSender(sender);
        notification.setReceiver(receiver);
        notification.setTitle(request.getTitle());
        notification.setContent(request.getContent());
        notification.setStatus(NotificationStatus.UNREAD);
        if (sender != null && sender.getId().equals(receiverId)) {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
        }
        notificationRepository.save(notification);

        return notificationConverter.toResponse(notification);
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional(readOnly = true)
    public List<NotificationResponse> getSentNotifications() {
        Long senderId = currentUserContext.getCurrentUserId();
        return notificationRepository
                .findAllBySender_IdAndReceiverIsNullOrderBySentAtDescIdDesc(senderId)
                .stream().map(notificationConverter::toResponse).toList();
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
                notificationRepository.findAllByReceiverIsNullOrReceiver_IdOrderBySentAtDescIdDesc(userId);

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
        if (notification.getReceiver() != null && !notification.getReceiver().getId().equals(userId)) {
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
