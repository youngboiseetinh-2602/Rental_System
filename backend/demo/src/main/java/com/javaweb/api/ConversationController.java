package com.javaweb.api;

import com.javaweb.model.response.ConversationResponse;
import com.javaweb.model.response.MessageResponse;
import com.javaweb.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Slice;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    public ResponseEntity<Page<ConversationResponse>> getMyConversations(
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(conversationService.myConversations(page));
    }

    @PostMapping("/{otherUserId}")
    public ResponseEntity<Slice<MessageResponse>> createConversation(
            @PathVariable Long otherUserId) {
        return ResponseEntity.ok(
                conversationService.createConversation(otherUserId));
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<Slice<MessageResponse>> getConversation(
            @PathVariable Long conversationId,
            @RequestParam(required = false) Long beforeId) {
        return ResponseEntity.ok(
                conversationService.getConversation(conversationId, beforeId));
    }

    @PatchMapping("/{conversationId}/block")
    public ResponseEntity<String> blockConversation(
            @PathVariable Long conversationId) {
        return ResponseEntity.ok(
                conversationService.blockConversation(conversationId));
    }

    @PatchMapping("/{conversationId}/unblock")
    public ResponseEntity<String> unblockConversation(
            @PathVariable Long conversationId) {
        return ResponseEntity.ok(
                conversationService.unblockConversation(conversationId));
    }
}
