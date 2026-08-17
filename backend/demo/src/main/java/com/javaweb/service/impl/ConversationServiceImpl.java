package com.javaweb.service.impl;

import com.javaweb.converter.ConversationConverter;
import com.javaweb.customException.ConflictException;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.entity.ConversationEntity;
import com.javaweb.entity.MessageEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ConversationStatus;
import com.javaweb.enums.MessageStatus;
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
           throw new DataNotFoundException("Không tìm thấy cuộc trò chuyện nào");
       }

       return conversations.map(conversation -> {
           ConversationResponse response = conversationConverter
                   .toConversationResponse(
                           conversation,
                           userId,
                           messageRepository
                                   .findFirstByConversation_IdAndHiddenFalseOrderByIdDesc(
                                           conversation.getId())
                                   .orElse(null));
           response.setUnreadCount(messageRepository
                   .countByConversation_IdAndSender_IdNotAndStatusAndHiddenFalse(
                           conversation.getId(),
                           userId,
                           MessageStatus.SENT));
           return response;
       });
   }

   @Override
   @Transactional
   public Slice<MessageResponse> createConversation(Long otherUserId) {
       Long currentUserId = currentUserContext.getCurrentUserId();
       if (currentUserId.equals(otherUserId)) {
           throw new IllegalArgumentException(
                   "Không thể tạo cuộc trò chuyện với chính mình");
       }
       UserEntity currentUser = userRepository.findById(currentUserId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Không tìm thấy người dùng: " + currentUserId));
       UserEntity otherUser = userRepository.findById(otherUserId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Không tìm thấy người dùng: " + otherUserId));
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
                       "Không tìm thấy cuộc trò chuyện"));

       if (!isParticipant(conversation, userId)) {
           throw new ForbiddenException(
                   "Bạn không có quyền xem cuộc trò chuyện này");
       }

       if (beforeId != null && beforeId <= 0) {
           throw new IllegalArgumentException("Mã tin nhắn trước đó phải là số dương");
       }
       messageRepository.markReceivedMessagesAsRead(conversationId, userId);
       PageRequest limit = PageRequest.of(0, MESSAGE_PAGE_SIZE);
       Slice<MessageEntity> messages = beforeId == null
               ? messageRepository
                       .findAllByConversation_IdOrderByIdDesc(
                               conversationId, limit)
               : messageRepository
                       .findAllByConversation_IdAndIdLessThanOrderByIdDesc(
                               conversationId, beforeId, limit);
       return messages.map(conversationConverter::toMessageResponse);
   }

   @Override
   @Transactional
   public void markConversationAsRead(Long conversationId) {
       Long userId = currentUserContext.getCurrentUserId();
       ConversationEntity conversation = conversationRepository.findById(conversationId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Không tìm thấy cuộc trò chuyện"));

       if (!isParticipant(conversation, userId)) {
           throw new ForbiddenException(
                   "Bạn không có quyền đánh dấu đã đọc cuộc trò chuyện này");
       }

       messageRepository.markReceivedMessagesAsRead(conversationId, userId);
   }

   @Override
   @Transactional
   public String blockConversation(Long conversationId){
       Long currentUserId = currentUserContext.getCurrentUserId();
       ConversationEntity conversation = conversationRepository.findById(conversationId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Không tìm thấy cuộc trò chuyện."));

       UserEntity blocker = findParticipant(conversation, currentUserId);
       if (blocker == null) {
           throw new ForbiddenException(
                   "Bạn không có quyền chặn cuộc trò chuyện này");
       }

       if (conversation.getStatus() == ConversationStatus.BLOCKED) {
           throw new ConflictException("Cuộc trò chuyện đã bị chặn");
       }

       conversation.setStatus(ConversationStatus.BLOCKED);
       conversation.setBlockedBy(blocker);
       return "cuộc trò chuyện đã bị chặn";
   }

   @Override
   @Transactional
   public String unblockConversation(Long conversationId) {
       Long currentUserId = currentUserContext.getCurrentUserId();
       ConversationEntity conversation = conversationRepository.findById(conversationId)
               .orElseThrow(() -> new DataNotFoundException(
                       "Không tìm thấy cuộc trò chuyện"));

       if (conversation.getStatus() != ConversationStatus.BLOCKED) {
           throw new ConflictException("Cuộc trò chuyện chưa bị chặn");
       }

       if (conversation.getBlockedBy() == null
               || !conversation.getBlockedBy().getId().equals(currentUserId)) {
           throw new ForbiddenException(
                   "Chỉ người đã chặn cuộc trò chuyện mới có thể bỏ chặn");
       }

       conversation.setStatus(ConversationStatus.ACTIVE);
       conversation.setBlockedBy(null);
       return "đã gỡ  chặn cuộc trò chuyện";
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
