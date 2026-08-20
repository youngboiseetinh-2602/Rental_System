package com.javaweb.api;

import com.javaweb.model.request.MessageRequest;
import com.javaweb.model.response.MessageResponse;
import com.javaweb.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;


    @PatchMapping("/api/messages/{messageId}")
    public ResponseEntity<Void> editMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody MessageRequest request) {
        messageService.editMessage(messageId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId) {
        messageService.deleteMessage(messageId);
        return ResponseEntity.noContent().build();
    }
}
