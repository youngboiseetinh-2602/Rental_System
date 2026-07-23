package com.javaweb.converter;

import com.javaweb.entity.ConversationEntity;
import com.javaweb.entity.MessageEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.model.response.ConversationResponse;
import com.javaweb.model.response.MessageResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConversationConverter {

    private final ModelMapper modelMapper;

    public ConversationResponse toConversationResponse(
            ConversationEntity conversation,
            Long currentUserId,
            MessageEntity latestMessage) {
        ConversationResponse response = modelMapper.map(
                conversation, ConversationResponse.class);

        UserEntity otherUser;
        if (conversation.getParticipantOne().getId().equals(currentUserId)) {
            otherUser = conversation.getParticipantTwo();
        } else if (conversation.getParticipantTwo().getId().equals(currentUserId)) {
            otherUser = conversation.getParticipantOne();
        } else {
            throw new IllegalArgumentException(
                    "Current user is not a conversation participant");
        }
        response.setName(otherUser.getFullName());

        if (latestMessage != null) {
            response.setLatestMessage(latestMessage.getContent());
            response.setLatestMessageSentAt(latestMessage.getSentAt());
        }

        return response;
    }

    public MessageResponse toMessageResponse(MessageEntity message) {
        MessageResponse response = modelMapper.map(message, MessageResponse.class);
        response.setSenderId(message.getSender().getId());
        return response;
    }
}
