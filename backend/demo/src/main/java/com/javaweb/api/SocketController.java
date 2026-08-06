package com.javaweb.api;

import com.javaweb.model.request.MessageRequest;
import com.javaweb.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import jakarta.validation.Valid;
@Controller
@RequiredArgsConstructor
public class SocketController {

    private final MessageService messageService;

    @MessageMapping("/chat.send")
    public void sendMessage( @Valid MessageRequest request) {
        messageService.sendMessage(request);

    }
}