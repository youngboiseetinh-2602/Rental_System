package com.javaweb.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.javaweb.enums.NotificationStatus;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationResponse {

    private Long id;

    private String title;

    private String content;

    private Long senderId;

    private String senderName;

    private NotificationStatus status;

    private LocalDateTime sentAt;

    private LocalDateTime readAt;
}
