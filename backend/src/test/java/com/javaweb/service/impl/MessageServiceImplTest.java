package com.javaweb.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.javaweb.converter.ConversationConverter;
import com.javaweb.entity.ConversationEntity;
import com.javaweb.entity.MessageEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ConversationStatus;
import com.javaweb.enums.MessageStatus;
import com.javaweb.model.request.MessageRequest;
import com.javaweb.model.response.ChatMessageEventResponse;
import com.javaweb.model.response.ConversationResponse;
import com.javaweb.model.response.MessageResponse;
import com.javaweb.repository.ConversationRepository;
import com.javaweb.repository.MessageRepository;
import com.javaweb.security.CurrentUserContext;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

    private static final String CHAT_DESTINATION = "/queue/chat-messages";

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationConverter conversationConverter;

    @Mock
    private CurrentUserContext currentUserContext;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MessageServiceImpl messageService;

    @Test
    void sendMessagePublishesPersonalizedConversationSummariesToBothParticipants() {
        UserEntity alice = user(1L, "alice", "Alice");
        UserEntity bob = user(2L, "bob", "Bob");
        ConversationEntity conversation = new ConversationEntity();
        conversation.setId(10L);
        conversation.setParticipantOne(alice);
        conversation.setParticipantTwo(bob);
        conversation.setStatus(ConversationStatus.ACTIVE);

        MessageRequest request = new MessageRequest();
        request.setConversationId(conversation.getId());
        request.setContent("Hello Bob");

        LocalDateTime sentAt = LocalDateTime.of(2026, 8, 15, 10, 30);
        MessageResponse messageResponse = new MessageResponse();
        messageResponse.setId(100L);
        messageResponse.setSenderId(alice.getId());
        messageResponse.setContent(request.getContent());
        messageResponse.setSentAt(sentAt);
        messageResponse.setStatus(MessageStatus.SENT);

        ConversationResponse aliceSummary = summary(
                conversation.getId(), bob.getId(), bob.getFullName(), request.getContent(), sentAt);
        ConversationResponse bobSummary = summary(
                conversation.getId(), alice.getId(), alice.getFullName(), request.getContent(), sentAt);

        when(currentUserContext.getCurrentUserId()).thenReturn(alice.getId());
        when(conversationRepository.findById(conversation.getId()))
                .thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(MessageEntity.class))).thenAnswer(invocation -> {
            MessageEntity savedMessage = invocation.getArgument(0);
            savedMessage.setId(messageResponse.getId());
            savedMessage.setSentAt(sentAt);
            return savedMessage;
        });
        when(conversationConverter.toMessageResponse(any(MessageEntity.class)))
                .thenReturn(messageResponse);
        when(conversationConverter.toConversationResponse(
                same(conversation), eq(alice.getId()), any(MessageEntity.class)))
                .thenReturn(aliceSummary);
        when(conversationConverter.toConversationResponse(
                same(conversation), eq(bob.getId()), any(MessageEntity.class)))
                .thenReturn(bobSummary);
        when(messageRepository
                .countByConversation_IdAndSender_IdNotAndStatusAndHiddenFalse(
                        conversation.getId(), alice.getId(), MessageStatus.SENT))
                .thenReturn(0L);
        when(messageRepository
                .countByConversation_IdAndSender_IdNotAndStatusAndHiddenFalse(
                        conversation.getId(), bob.getId(), MessageStatus.SENT))
                .thenReturn(1L);

        messageService.sendMessage(request);

        ArgumentCaptor<ChatMessageEventResponse> alicePayload =
                ArgumentCaptor.forClass(ChatMessageEventResponse.class);
        ArgumentCaptor<ChatMessageEventResponse> bobPayload =
                ArgumentCaptor.forClass(ChatMessageEventResponse.class);
        verify(messagingTemplate).convertAndSendToUser(
                eq(alice.getUsername()), eq(CHAT_DESTINATION), alicePayload.capture());
        verify(messagingTemplate).convertAndSendToUser(
                eq(bob.getUsername()), eq(CHAT_DESTINATION), bobPayload.capture());

        assertSummary(alicePayload.getValue(), aliceSummary, bob, 0L, messageResponse);
        assertSummary(bobPayload.getValue(), bobSummary, alice, 1L, messageResponse);
        verifyNoMoreInteractions(messagingTemplate);
    }

    private static UserEntity user(Long id, String username, String fullName) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setUsername(username);
        user.setFullName(fullName);
        return user;
    }

    private static ConversationResponse summary(
            Long conversationId,
            Long otherUserId,
            String otherUserName,
            String latestMessage,
            LocalDateTime latestMessageSentAt) {
        ConversationResponse summary = new ConversationResponse();
        summary.setId(conversationId);
        summary.setOtherUserId(otherUserId);
        summary.setName(otherUserName);
        summary.setLatestMessage(latestMessage);
        summary.setLatestMessageSentAt(latestMessageSentAt);
        summary.setStatus(ConversationStatus.ACTIVE);
        return summary;
    }

    private static void assertSummary(
            ChatMessageEventResponse event,
            ConversationResponse expectedSummary,
            UserEntity expectedOtherUser,
            Long expectedUnreadCount,
            MessageResponse expectedMessage) {
        assertSame(expectedSummary, event.getConversation());
        assertEquals(expectedOtherUser.getId(), event.getConversation().getOtherUserId());
        assertEquals(expectedOtherUser.getFullName(), event.getConversation().getName());
        assertEquals(expectedUnreadCount, event.getConversation().getUnreadCount());
        assertEquals(expectedMessage.getContent(), event.getConversation().getLatestMessage());
        assertEquals(expectedMessage.getSentAt(), event.getConversation().getLatestMessageSentAt());
        assertSame(expectedMessage, event.getMessage());
    }
}
