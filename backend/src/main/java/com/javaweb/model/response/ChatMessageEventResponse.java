package com.javaweb.model.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageEventResponse {

    private ConversationResponse conversation;

    private MessageResponse message;
}
