package com.javaweb.service.impl;

import com.javaweb.converter.ConversationConverter;
import com.javaweb.customException.ConflictException;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.entity.ConversationEntity;
import com.javaweb.entity.MessageEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ConversationStatus;
import com.javaweb.model.response.ConversationResponse;
import com.javaweb.model.response.MessageResponse;
import com.javaweb.repository.ConversationRepository;
import com.javaweb.repository.MessageRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;

@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {
    private static final int MESSAGE_PAGE_SIZE = 30;

    private final ConversationConverter conversationConverter;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final CurrentUserContext currentUserContext;

   @Override
   @Transactional
   public Page<ConversationResponse> myConversations(int page){
       long userId = currentUserContext.getCurrentUserId();
       Page<ConversationEntity> conversations =
               conversationRepository.findAllByParticipantId(
                       userId, PageRequest.of(page, 20));

       if(conversations.isEmpty()){
           throw new DataNotFoundException("No conversation found");
       }

       return conversations.map(conversation -> conversationConverter
               .toConversationResponse(
                       conversation,
                       userId,
                       messageRepository
                               .findFirstByConversation_IdAndHiddenFalseOrderByIdDesc(
                                       conversation.getId())
                               .orElse(null)));
   }

   @Override
   @Transactional
   public Slice<MessageResponse> createConversation(Long otherUserId) {
       Long currentUserId = currentUserContext.getCurrentUserId();
       if (currentUserId.equals(otherUserId)) {
           throw new IllegalArgumentException(
                   "Cannot create a conversation with yourself");
       }

       UserEntity currentUser = getUser(currentUserId);
       UserEntity otherUser = getUser(otherUserId);

       UserEntity participantOne = currentUserId < otherUserId
               ? currentUser
               : otherUser;
       UserEntity participantTwo = currentUserId < otherUserId
               ? otherUser
               : currentUser;

       ConversationEntity conversation = conversationRepository
               .findByParticipantOne_IdAndParticipantTwo_Id(
                       participantOne.getId(), participantTwo.getId())
               .orElseGet(() -> {
                   ConversationEntity newConversation = new ConversationEntity();
                   newConversation.setParticipantOne(participantOne);
                   newConversation.setParticipantTwo(participantTwo);
                   return conversationRepository.save(newConversation);
               });

       return getConversation(conversation.getId(), null);
   }

   @Override
   @Transactional
   public Slice<MessageResponse> getConversation(
           Long conversationId,
           Long beforeId) {
       Long userId = currentUserContext.getCurrentUserId();
       ConversationEntity conversation = conversationRepository.findById(conversationId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Conversation not found: " + conversationId));

       if (!isParticipant(conversation, userId)) {
           throw new ForbiddenException(
                   "You are not allowed to view this conversation");
       }

       if (beforeId != null && beforeId <= 0) {
           throw new IllegalArgumentException("beforeId must be positive");
       }

       messageRepository.markReceivedMessagesAsRead(conversationId, userId);

       PageRequest limit = PageRequest.of(0, MESSAGE_PAGE_SIZE);
       Slice<MessageEntity> messages = beforeId == null
               ? messageRepository
                       .findAllByConversation_IdAndHiddenFalseOrderByIdDesc(
                               conversationId, limit)
               : messageRepository
                       .findAllByConversation_IdAndHiddenFalseAndIdLessThanOrderByIdDesc(
                               conversationId, beforeId, limit);

       return messages.map(conversationConverter::toMessageResponse);
   }

   private UserEntity getUser(Long userId) {
       return userRepository.findById(userId)
               .orElseThrow(() -> new DataNotFoundException(
                       "User not found: " + userId));
   }

   @Override
   @Transactional
   public String blockConversation(Long conversationId){
       Long currentUserId = currentUserContext.getCurrentUserId();
       ConversationEntity conversation = conversationRepository.findById(conversationId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Conversation not found."));

       UserEntity blocker = findParticipant(conversation, currentUserId);
       if (blocker == null) {
           throw new ForbiddenException(
                   "You are not allowed to block this conversation");
       }

       if (conversation.getStatus() == ConversationStatus.BLOCKED) {
           throw new ConflictException("Conversation is already blocked");
       }

       conversation.setStatus(ConversationStatus.BLOCKED);
       conversation.setBlockedBy(blocker);
       return "Conversation blocked successfully";
   }

   @Override
   @Transactional
   public String unblockConversation(Long conversationId) {
       Long currentUserId = currentUserContext.getCurrentUserId();
       ConversationEntity conversation = conversationRepository.findById(conversationId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Conversation not found: " + conversationId));

       if (conversation.getStatus() != ConversationStatus.BLOCKED) {
           throw new ConflictException("Conversation is not blocked");
       }

       if (conversation.getBlockedBy() == null
               || !conversation.getBlockedBy().getId().equals(currentUserId)) {
           throw new ForbiddenException(
                   "Only the user who blocked this conversation can unblock it");
       }

       conversation.setStatus(ConversationStatus.ACTIVE);
       conversation.setBlockedBy(null);
       return "Conversation unblocked successfully";
   }

   private boolean isParticipant(
           ConversationEntity conversation, Long userId) {
       return findParticipant(conversation, userId) != null;
   }

   private UserEntity findParticipant(
           ConversationEntity conversation, Long userId) {
       if (conversation.getParticipantOne().getId().equals(userId)) {
           return conversation.getParticipantOne();
       }
       if (conversation.getParticipantTwo().getId().equals(userId)) {
           return conversation.getParticipantTwo();
       }
       return null;
   }

}
