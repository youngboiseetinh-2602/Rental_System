package com.javaweb.model.response;

import com.javaweb.enums.MessageStatus;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MessageResponse {

    private Long id;

    private Long senderId;

    private String content;

    private LocalDateTime sentAt;

    private MessageStatus status;

    private String note;
}
