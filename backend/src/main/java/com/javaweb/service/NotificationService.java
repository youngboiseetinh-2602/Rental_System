package com.javaweb.service;

import com.javaweb.model.request.NotificationRequest;
import com.javaweb.model.response.NotificationResponse;
import java.util.List;

public interface NotificationService {

    String sendNotificationToAll(NotificationRequest request);

    String sendNotificationToAudience(com.javaweb.enums.NotificationAudience audience, NotificationRequest request);

    NotificationResponse createNotification(Long receiverId, NotificationRequest request);

    NotificationResponse createOwnerNotification(Long receiverId, NotificationRequest request);

    NotificationResponse createSystemNotification(Long receiverId, NotificationRequest request);

    List<NotificationResponse> getNotifications();

    List<NotificationResponse> getSentNotifications();

    String readNotification(Long notificationId);
}
