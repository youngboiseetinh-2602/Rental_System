package com.javaweb.service;

import com.javaweb.model.request.MessageRequest;
import com.javaweb.model.response.MessageResponse;

public interface MessageService {

    void sendMessage(MessageRequest request);

    void editMessage(Long messageId, MessageRequest request);

    void deleteMessage(Long messageId);
}
