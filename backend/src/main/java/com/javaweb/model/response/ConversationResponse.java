package com.javaweb.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.javaweb.enums.ConversationStatus;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConversationResponse {

    private Long id;

    private Long otherUserId;

    private String name;

    private String avatarUrl;

    private String latestMessage;

    private LocalDateTime latestMessageSentAt;

    private ConversationStatus status;

    private Boolean blockedByCurrentUser;

    private Long unreadCount;
}
