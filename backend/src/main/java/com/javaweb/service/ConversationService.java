package com.javaweb.service;

import com.javaweb.model.response.ConversationResponse;
import com.javaweb.model.response.CursorPageResponse;
import com.javaweb.model.response.MessageResponse;
import org.springframework.data.domain.Slice;

public interface ConversationService {


    CursorPageResponse<ConversationResponse> myConversations(String cursor, int size);

    Slice<MessageResponse> createConversation(Long otherUserId);

    Slice<MessageResponse> getConversation(
            Long conversationId,
            Long beforeId);

    void markConversationAsRead(Long conversationId);

    String blockConversation(Long conversationId);

    String unblockConversation(Long conversationId);
}
