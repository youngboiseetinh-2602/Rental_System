package com.javaweb.service;

import com.javaweb.model.response.ConversationResponse;
import com.javaweb.model.response.MessageResponse;
import org.springframework.data.domain.Page;

public interface ConversationService {


    Page<ConversationResponse> myConversations(int page);

    Page<MessageResponse> createConversation(Long otherUserId);

    Page<MessageResponse> getConversation(Long conversationId, int page);
}
