package com.javaweb.service;

import com.javaweb.model.request.NotificationRequest;
import com.javaweb.model.response.NotificationResponse;
import java.util.List;

public interface NotificationService {

    int sendNotificationToAll(NotificationRequest request);

    NotificationResponse createNotification(Long receiverId, NotificationRequest request);

    NotificationResponse createOwnerNotification(Long receiverId, NotificationRequest request);

    NotificationResponse createSystemNotification(Long receiverId, NotificationRequest request);

    List<NotificationResponse> getNotifications();

    String readNotification(Long notificationId);
}
