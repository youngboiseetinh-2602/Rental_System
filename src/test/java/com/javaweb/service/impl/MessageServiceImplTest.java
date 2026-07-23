package com.javaweb.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.javaweb.converter.ConversationConverter;
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
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;

class MessageServiceImplTest {

    private final MessageRepository messageRepository = mock(MessageRepository.class);
    private final ConversationRepository conversationRepository =
            mock(ConversationRepository.class);
    private final ConversationConverter conversationConverter =
            mock(ConversationConverter.class);
    private final CurrentUserContext currentUserContext = mock(CurrentUserContext.class);

    private final MessageServiceImpl messageService = new MessageServiceImpl(
            messageRepository,
            conversationRepository,
            conversationConverter,
            currentUserContext);

    @ParameterizedTest
    @ValueSource(longs = {1L, 2L})
    void savesMessageForConversationParticipant(long currentUserId) {
        ConversationEntity conversation = createConversation();
        MessageRequest request = new MessageRequest();
        request.setContent("Hello");
        MessageResponse expectedResponse = new MessageResponse();

        when(currentUserContext.getCurrentUserId()).thenReturn(currentUserId);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(MessageEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(conversationConverter.toMessageResponse(any(MessageEntity.class)))
                .thenReturn(expectedResponse);

        MessageResponse result = messageService.sendMessage(request, 10L);

        ArgumentCaptor<MessageEntity> messageCaptor =
                ArgumentCaptor.forClass(MessageEntity.class);
        verify(messageRepository).save(messageCaptor.capture());
        MessageEntity savedMessage = messageCaptor.getValue();

        assertEquals("Hello", savedMessage.getContent());
        assertEquals(MessageStatus.SENT, savedMessage.getStatus());
        assertSame(conversation, savedMessage.getConversation());
        assertEquals(currentUserId, savedMessage.getSender().getId());
        assertSame(savedMessage, conversation.getMessages().getFirst());
        verify(conversationRepository).save(conversation);
        assertSame(expectedResponse, result);
    }

    @Test
    void rejectsMessageFromNonParticipant() {
        ConversationEntity conversation = createConversation();
        when(currentUserContext.getCurrentUserId()).thenReturn(3L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        assertThrows(
                ForbiddenException.class,
                () -> messageService.sendMessage(new MessageRequest(), 10L));
        verify(messageRepository, never()).save(any(MessageEntity.class));
        verify(conversationRepository, never()).save(conversation);
    }

    @Test
    void rejectsMessageWhenConversationIsBlocked() {
        ConversationEntity conversation = createConversation();
        conversation.setStatus(ConversationStatus.BLOCKED);
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        assertThrows(
                ForbiddenException.class,
                () -> messageService.sendMessage(new MessageRequest(), 10L));
        verify(messageRepository, never()).save(any(MessageEntity.class));
        verify(conversationRepository, never()).save(conversation);
    }

    @Test
    void editsOwnMessageAndAddsEditedNote() {
        MessageEntity message = createMessage();
        MessageRequest request = new MessageRequest();
        request.setContent("Updated content");

        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(messageRepository.findById(20L)).thenReturn(Optional.of(message));

        messageService.editMessage(20L, request);

        assertEquals("Updated content", message.getContent());
        assertEquals("Đã chỉnh sửa", message.getNote());
        verify(messageRepository).save(message);
    }

    @Test
    void leavesNoteNullWhenContentDoesNotChange() {
        MessageEntity message = createMessage();
        MessageRequest request = new MessageRequest();
        request.setContent("Original content");

        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(messageRepository.findById(20L)).thenReturn(Optional.of(message));

        messageService.editMessage(20L, request);

        assertNull(message.getNote());
        verify(messageRepository, never()).save(message);
    }

    @Test
    void rejectsEditingAnotherUsersMessage() {
        MessageEntity message = createMessage();
        MessageRequest request = new MessageRequest();
        request.setContent("Updated content");

        when(currentUserContext.getCurrentUserId()).thenReturn(2L);
        when(messageRepository.findById(20L)).thenReturn(Optional.of(message));

        assertThrows(
                ForbiddenException.class,
                () -> messageService.editMessage(20L, request));
        verify(messageRepository, never()).save(message);
    }

    @Test
    void hidesOwnMessageInsteadOfDeletingIt() {
        MessageEntity message = createMessage();
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(messageRepository.findById(20L)).thenReturn(Optional.of(message));

        messageService.deleteMessage(20L);

        assertTrue(message.isHidden());
        verify(messageRepository).save(message);
    }

    @Test
    void rejectsDeletingAnotherUsersMessage() {
        MessageEntity message = createMessage();
        when(currentUserContext.getCurrentUserId()).thenReturn(2L);
        when(messageRepository.findById(20L)).thenReturn(Optional.of(message));

        assertThrows(
                ForbiddenException.class,
                () -> messageService.deleteMessage(20L));
        assertFalse(message.isHidden());
        verify(messageRepository, never()).save(message);
    }

    @Test
    void doesNotSaveMessageAgainWhenAlreadyHidden() {
        MessageEntity message = createMessage();
        message.setHidden(true);
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(messageRepository.findById(20L)).thenReturn(Optional.of(message));

        messageService.deleteMessage(20L);

        assertTrue(message.isHidden());
        verify(messageRepository, never()).save(message);
    }

    @Test
    void rejectsEditingMessageInBlockedConversation() {
        MessageEntity message = createMessage();
        message.getConversation().setStatus(ConversationStatus.BLOCKED);
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(messageRepository.findById(20L)).thenReturn(Optional.of(message));

        assertThrows(
                ForbiddenException.class,
                () -> messageService.editMessage(20L, new MessageRequest()));
        verify(messageRepository, never()).save(message);
    }

    private ConversationEntity createConversation() {
        UserEntity owner = new UserEntity();
        owner.setId(1L);

        UserEntity customer = new UserEntity();
        customer.setId(2L);

        ConversationEntity conversation = new ConversationEntity();
        conversation.setId(10L);
        conversation.setParticipantOne(owner);
        conversation.setParticipantTwo(customer);
        return conversation;
    }

    private MessageEntity createMessage() {
        ConversationEntity conversation = createConversation();
        MessageEntity message = new MessageEntity();
        message.setId(20L);
        message.setConversation(conversation);
        message.setSender(conversation.getParticipantOne());
        message.setContent("Original content");
        return message;
    }
}
