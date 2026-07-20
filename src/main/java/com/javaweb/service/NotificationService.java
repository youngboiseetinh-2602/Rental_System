package com.javaweb.service;

import com.javaweb.model.request.NotificationRequest;
import com.javaweb.model.response.NotificationResponse;
import java.util.List;

public interface NotificationService {

    NotificationResponse createNotification(Long senderId, NotificationRequest request);

    boolean notificationExists(Long receiverId, String title, String content);

    List<NotificationResponse> getNotifications();

    String readNotification(Long notificationId);
}
