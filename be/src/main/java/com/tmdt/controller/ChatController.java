package com.tmdt.controller;

import com.tmdt.model.Conversation;
import com.tmdt.model.Message;
import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private SupabaseService supabaseService;

    @GetMapping("/conversations/{userId}")
    public List<Conversation> getConversations(@PathVariable String userId) {
        return supabaseService.getConversations(userId);
    }

    @PostMapping("/conversations/get-or-create")
    public Conversation getOrCreateConversation(@RequestBody Map<String, String> params) {
        return supabaseService.getOrCreateConversation(params.get("user1_id"), params.get("user2_id"));
    }

    @GetMapping("/messages/{conversationId}")
    public List<Message> getMessages(@PathVariable String conversationId) {
        return supabaseService.getMessages(conversationId);
    }

    @PostMapping("/messages")
    public Message sendMessage(@RequestBody Map<String, Object> messageData) {
        return supabaseService.createMessage(messageData);
    }

    @PostMapping("/messages/mark-read")
    public ResponseEntity<?> markMessagesAsRead(@RequestBody Map<String, String> params) {
        try {
            supabaseService.markMessagesAsRead(params.get("conversation_id"), params.get("user_id"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
