package com.javaweb.service.impl;

import com.javaweb.converter.ConversationConverter;
import com.javaweb.repository.ConversationRepository;
import com.javaweb.repository.MessageRepository;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationConverter conversationConverter;
    private final CurrentUserContext currentUserContext;
}
