package com.javaweb.service.impl;

import com.javaweb.converter.ConversationConverter;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.entity.ConversationEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserRole;
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

import static com.javaweb.enums.ConversationStatus.READ;

@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {
    private final ConversationConverter conversationConverter;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final CurrentUserContext currentUserContext;

   @Override
   @Transactional(readOnly = true)
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
                               .findFirstByConversation_IdOrderBySentAtDesc(
                                       conversation.getId())
                               .orElse(null)));
   }

   @Override
   @Transactional
   public Page<MessageResponse> createConversation(Long otherUserId) {
       Long currentUserId = currentUserContext.getCurrentUserId();
       UserEntity currentUser = getUser(currentUserId);
       UserEntity otherUser = getUser(otherUserId);

       UserEntity owner;
       UserEntity customer;
       if (currentUser.getRole() == UserRole.OWNER
               && otherUser.getRole() == UserRole.CUSTOMER) {
           owner = currentUser;
           customer = otherUser;
       } else if (currentUser.getRole() == UserRole.CUSTOMER
               && otherUser.getRole() == UserRole.OWNER) {
           owner = otherUser;
           customer = currentUser;
       } else {
           throw new IllegalArgumentException(
                   "Conversation must be between an owner and a customer");
       }

       ConversationEntity conversation = conversationRepository
               .findByOwner_IdAndCustomer_Id(owner.getId(), customer.getId())
               .orElseGet(() -> {
                   ConversationEntity newConversation = new ConversationEntity();
                   newConversation.setOwner(owner);
                   newConversation.setCustomer(customer);
                   return conversationRepository.save(newConversation);
               });

       return getConversation(conversation.getId(), 0);
   }

   @Override
   @Transactional
   public Page<MessageResponse> getConversation(Long conversationId, int page){
       Long userId = currentUserContext.getCurrentUserId();
       ConversationEntity conversation = conversationRepository.findById(conversationId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Conversation not found: " + conversationId));

       if (!conversation.getOwner().getId().equals(userId)
               && !conversation.getCustomer().getId().equals(userId)) {
           throw new ForbiddenException(
                   "You are not a participant of this conversation");
       }

       conversation.setStatus(READ);

       return messageRepository
               .findAllByConversation_IdOrderBySentAtDesc(
                       conversationId, PageRequest.of(page, 30))
               .map(message -> conversationConverter
                       .toMessageResponse(message, userId));
   }

   private UserEntity getUser(Long userId) {
       return userRepository.findById(userId)
               .orElseThrow(() -> new DataNotFoundException(
                       "User not found: " + userId));
   }

}
