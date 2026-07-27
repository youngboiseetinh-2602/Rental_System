package com.javaweb.service;

import com.javaweb.model.request.NotificationRequest;
import com.javaweb.model.response.NotificationResponse;
import java.util.List;

public interface NotificationService {

    NotificationResponse createNotification(Long senderId, NotificationRequest request);

    NotificationResponse createSystemNotification(NotificationRequest request);

    List<NotificationResponse> getNotifications();

    String readNotification(Long notificationId);
}
