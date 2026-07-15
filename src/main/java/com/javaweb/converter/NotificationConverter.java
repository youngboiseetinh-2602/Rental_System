package com.javaweb.converter;

import com.javaweb.entity.NotificationEntity;
import com.javaweb.model.response.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationConverter {

    private final ModelMapper modelMapper;

    public NotificationResponse toResponse(NotificationEntity notification) {
        NotificationResponse response = modelMapper.map(
                notification, NotificationResponse.class);
        response.setSenderId(notification.getSender().getId());
        response.setSenderName(notification.getSender().getFullName());
        return response;
    }
}
