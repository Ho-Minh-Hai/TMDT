package com.tmdt.controller;

import com.tmdt.model.Conversation;
import com.tmdt.model.Message;
import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
}
