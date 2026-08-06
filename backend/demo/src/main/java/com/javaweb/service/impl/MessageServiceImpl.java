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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private static final String EDITED_NOTE = "Đã chỉnh sửa";
    private static final String RECALLED_NOTE = "Đã thu hồi";

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationConverter conversationConverter;
    private final CurrentUserContext currentUserContext;
    private final SimpMessagingTemplate messagingTemplate;

    

    @Override
    @Transactional
    public void sendMessage(MessageRequest request) {
        Long userId = currentUserContext.getCurrentUserId();
        ConversationEntity conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy cuộc trò chuyện"));

        UserEntity sender;
        if (conversation.getParticipantOne().getId().equals(userId)) {
            sender = conversation.getParticipantOne();
        } else if (conversation.getParticipantTwo().getId().equals(userId)) {
            sender = conversation.getParticipantTwo();
        } else {
            throw new ForbiddenException(
                    "Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này");
        }

        if (conversation.getStatus() == ConversationStatus.BLOCKED) {
            throw new ForbiddenException(
                    "Không thể gửi tin nhắn trong cuộc trò chuyện đã bị chặn");
        }

        MessageEntity message = new MessageEntity();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent());
        message.setStatus(MessageStatus.SENT);

        MessageEntity savedMessage = messageRepository.save(message);
        conversation.getMessages().add(savedMessage);
        conversationRepository.save(conversation);

        MessageResponse response = conversationConverter.toMessageResponse(savedMessage);
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversation.getId(), response);

    }

    @Override
    @Transactional
    public void editMessage(Long messageId, MessageRequest request) {
        Long userId = currentUserContext.getCurrentUserId();
        MessageEntity message = messageRepository.findById(messageId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy tin nhắn"));

        if (!message.getSender().getId().equals(userId)) {
            throw new ForbiddenException(
                    "Bạn không có quyền chỉnh sửa tin nhắn này");
        }

        if (message.isHidden()) {
            throw new ForbiddenException(
                    "Không thể chỉnh sửa tin nhắn đã thu hồi");
        }

        if (message.getConversation().getStatus() == ConversationStatus.BLOCKED) {
            throw new ForbiddenException(
                    "Không thể chỉnh sửa tin nhắn trong cuộc trò chuyện đã bị chặn");
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
                        "Không tìm thấy tin nhắn"));

        if (!message.getSender().getId().equals(userId)) {
            throw new ForbiddenException(
                    "Bạn không có quyền xóa tin nhắn này");
        }

        if (!message.isHidden()) {
            message.setHidden(true);
            message.setNote(RECALLED_NOTE);
            messageRepository.save(message);
        }
    }
}
