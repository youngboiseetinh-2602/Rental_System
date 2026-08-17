package com.javaweb.service;

import com.javaweb.model.response.ConversationResponse;
import com.javaweb.model.response.MessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Slice;

public interface ConversationService {


    Page<ConversationResponse> myConversations(int page);

    Slice<MessageResponse> createConversation(Long otherUserId);

    Slice<MessageResponse> getConversation(
            Long conversationId,
            Long beforeId);

    void markConversationAsRead(Long conversationId);

    String blockConversation(Long conversationId);

    String unblockConversation(Long conversationId);
}
