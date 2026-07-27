package com.javaweb.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.javaweb.converter.ConversationConverter;
import com.javaweb.customException.ConflictException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.entity.ConversationEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ConversationStatus;
import com.javaweb.enums.UserRole;
import com.javaweb.repository.ConversationRepository;
import com.javaweb.repository.MessageRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CurrentUserContext;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.SliceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ConversationServiceImplTest {

    private final ConversationConverter conversationConverter =
            mock(ConversationConverter.class);
    private final ConversationRepository conversationRepository =
            mock(ConversationRepository.class);
    private final MessageRepository messageRepository = mock(MessageRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final CurrentUserContext currentUserContext = mock(CurrentUserContext.class);

    private final ConversationServiceImpl conversationService =
            new ConversationServiceImpl(
                    conversationConverter,
                    conversationRepository,
                    messageRepository,
                    userRepository,
                    currentUserContext);

    @ParameterizedTest
    @ValueSource(longs = {1L, 2L})
    void allowsConversationParticipantsToBlock(long currentUserId) {
        ConversationEntity conversation = createConversation();
        when(currentUserContext.getCurrentUserId()).thenReturn(currentUserId);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        String result = conversationService.blockConversation(10L);

        assertEquals(ConversationStatus.BLOCKED, conversation.getStatus());
        assertEquals(currentUserId, conversation.getBlockedBy().getId());
        assertEquals("Conversation blocked successfully", result);
    }

    @Test
    void rejectsNonParticipantFromBlockingConversation() {
        ConversationEntity conversation = createConversation();
        when(currentUserContext.getCurrentUserId()).thenReturn(3L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        assertThrows(
                ForbiddenException.class,
                () -> conversationService.blockConversation(10L));
        assertEquals(ConversationStatus.ACTIVE, conversation.getStatus());
    }

    @Test
    void createsConversationBetweenAnyTwoUsersInCanonicalIdOrder() {
        UserEntity currentUser = new UserEntity();
        currentUser.setId(9L);
        currentUser.setRole(UserRole.OWNER);

        UserEntity otherUser = new UserEntity();
        otherUser.setId(3L);
        otherUser.setRole(UserRole.OWNER);

        ConversationEntity conversation = new ConversationEntity();
        conversation.setId(10L);
        conversation.setParticipantOne(otherUser);
        conversation.setParticipantTwo(currentUser);

        when(currentUserContext.getCurrentUserId()).thenReturn(9L);
        when(userRepository.findById(9L)).thenReturn(Optional.of(currentUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(otherUser));
        when(conversationRepository.findByParticipantOne_IdAndParticipantTwo_Id(3L, 9L))
                .thenReturn(Optional.of(conversation));
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findAllByConversation_IdAndHiddenFalseOrderByIdDesc(
                eq(10L), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of()));

        conversationService.createConversation(3L);

        verify(conversationRepository)
                .findByParticipantOne_IdAndParticipantTwo_Id(3L, 9L);
    }

    @Test
    void allowsOnlyBlockerToUnblockConversation() {
        ConversationEntity conversation = createConversation();
        conversation.setStatus(ConversationStatus.BLOCKED);
        conversation.setBlockedBy(conversation.getParticipantOne());
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        String result = conversationService.unblockConversation(10L);

        assertEquals(ConversationStatus.ACTIVE, conversation.getStatus());
        assertNull(conversation.getBlockedBy());
        assertEquals("Conversation unblocked successfully", result);
    }

    @Test
    void rejectsUnblockFromOtherParticipant() {
        ConversationEntity conversation = createConversation();
        conversation.setStatus(ConversationStatus.BLOCKED);
        conversation.setBlockedBy(conversation.getParticipantOne());
        when(currentUserContext.getCurrentUserId()).thenReturn(2L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        assertThrows(
                ForbiddenException.class,
                () -> conversationService.unblockConversation(10L));
        assertEquals(ConversationStatus.BLOCKED, conversation.getStatus());
        assertEquals(1L, conversation.getBlockedBy().getId());
    }

    @Test
    void rejectsUnblockWhenConversationIsActive() {
        ConversationEntity conversation = createConversation();
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        assertThrows(
                ConflictException.class,
                () -> conversationService.unblockConversation(10L));
    }

    @Test
    void doesNotAllowAnotherParticipantToReplaceExistingBlocker() {
        ConversationEntity conversation = createConversation();
        conversation.setStatus(ConversationStatus.BLOCKED);
        conversation.setBlockedBy(conversation.getParticipantOne());
        when(currentUserContext.getCurrentUserId()).thenReturn(2L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        assertThrows(
                ConflictException.class,
                () -> conversationService.blockConversation(10L));
        assertEquals(1L, conversation.getBlockedBy().getId());
    }

    @Test
    void marksReceivedMessagesAsReadWhenParticipantViewsConversation() {
        ConversationEntity conversation = createConversation();
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(messageRepository
                .findAllByConversation_IdAndHiddenFalseOrderByIdDesc(
                        eq(10L), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of()));

        conversationService.getConversation(10L, null);

        verify(messageRepository).markReceivedMessagesAsRead(10L, 1L);
    }

    @Test
    void rejectsNonParticipantBeforeMarkingMessagesAsRead() {
        ConversationEntity conversation = createConversation();
        when(currentUserContext.getCurrentUserId()).thenReturn(3L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        assertThrows(
                ForbiddenException.class,
                () -> conversationService.getConversation(10L, null));
        verify(messageRepository, never())
                .markReceivedMessagesAsRead(10L, 3L);
    }

    @Test
    void loadsOlderMessagesUsingIdCursor() {
        ConversationEntity conversation = createConversation();
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(messageRepository
                .findAllByConversation_IdAndHiddenFalseAndIdLessThanOrderByIdDesc(
                        eq(10L), eq(99L), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of()));

        conversationService.getConversation(10L, 99L);

        verify(messageRepository)
                .findAllByConversation_IdAndHiddenFalseAndIdLessThanOrderByIdDesc(
                        eq(10L), eq(99L), any(Pageable.class));
    }

    @Test
    void rejectsNonPositiveMessageCursor() {
        ConversationEntity conversation = createConversation();
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        assertThrows(
                IllegalArgumentException.class,
                () -> conversationService.getConversation(10L, 0L));
        verify(messageRepository, never())
                .markReceivedMessagesAsRead(10L, 1L);
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
}
