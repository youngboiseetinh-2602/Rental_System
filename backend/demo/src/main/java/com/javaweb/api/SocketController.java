package com.javaweb.api;

import com.javaweb.model.request.MessageRequest;
import com.javaweb.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class SocketController {

    private final MessageService messageService;

    @MessageMapping("/chat.send")
    public void sendMessage(MessageRequest request) {
        messageService.sendMessage(request);

    }
}