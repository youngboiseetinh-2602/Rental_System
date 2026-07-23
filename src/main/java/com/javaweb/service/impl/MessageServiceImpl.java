package com.javaweb.service.impl;

import com.javaweb.converter.ConversationConverter;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.entity.ConversationEntity;
import com.javaweb.entity.MessageEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ConversationStatus;
import com.javaweb.enums.MessageStatus;
import com.javaweb.model.request.MessageRequest;
import com.javaweb.model.response.MessageResponse;
import com.javaweb.repository.ConversationRepository;
import com.javaweb.repository.MessageRepository;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.MessageService;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private static final String EDITED_NOTE = "Đã chỉnh sửa";

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationConverter conversationConverter;
    private final CurrentUserContext currentUserContext;

    @Override
    @Transactional
    public MessageResponse sendMessage(
            MessageRequest request, Long conversationId) {
        Long userId = currentUserContext.getCurrentUserId();
        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Conversation not found: " + conversationId));

        UserEntity sender;
        if (conversation.getParticipantOne().getId().equals(userId)) {
            sender = conversation.getParticipantOne();
        } else if (conversation.getParticipantTwo().getId().equals(userId)) {
            sender = conversation.getParticipantTwo();
        } else {
            throw new ForbiddenException(
                    "You are not allowed to send messages in this conversation");
        }

        if (conversation.getStatus() == ConversationStatus.BLOCKED) {
            throw new ForbiddenException(
                    "Cannot send messages in a blocked conversation");
        }

        MessageEntity message = new MessageEntity();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent());
        message.setStatus(MessageStatus.SENT);

        MessageEntity savedMessage = messageRepository.save(message);
        conversation.getMessages().add(savedMessage);
        conversationRepository.save(conversation);

        return conversationConverter.toMessageResponse(savedMessage);
    }

    @Override
    @Transactional
    public void editMessage(Long messageId, MessageRequest request) {
        Long userId = currentUserContext.getCurrentUserId();
        MessageEntity message = messageRepository.findById(messageId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Message not found"));

        if (!message.getSender().getId().equals(userId)) {
            throw new ForbiddenException(
                    "You are not allowed to edit this message");
        }

        if (message.getConversation().getStatus() == ConversationStatus.BLOCKED) {
            throw new ForbiddenException(
                    "Cannot edit messages in a blocked conversation");
        }

        if (!Objects.equals(message.getContent(), request.getContent())) {
            message.setContent(request.getContent());
            message.setNote(EDITED_NOTE);
            messageRepository.save(message);
        }
    }

    @Override
    @Transactional
    public void deleteMessage(Long messageId) {
        Long userId = currentUserContext.getCurrentUserId();
        MessageEntity message = messageRepository.findById(messageId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Message not found"));

        if (!message.getSender().getId().equals(userId)) {
            throw new ForbiddenException(
                    "You are not allowed to delete this message");
        }

        if (!message.isHidden()) {
            message.setHidden(true);
            messageRepository.save(message);
        }
    }
}
