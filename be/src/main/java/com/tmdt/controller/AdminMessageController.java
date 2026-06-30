package com.tmdt.controller;

import com.tmdt.dto.AdminConversationDTO;
import com.tmdt.dto.AdminMessageDTO;
import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller quản lý tin nhắn dành cho Admin.
 * Cho phép xem danh sách hội thoại và nội dung tin nhắn giữa các người dùng.
 */
@RestController
@RequestMapping("/api/admin/messages")
@CrossOrigin(origins = "*") // Hỗ trợ gọi API từ React (Vite/CRA)
public class AdminMessageController {

    @Autowired
    private SupabaseService supabaseService;

    /**
     * Lấy danh sách tất cả các cuộc hội thoại trong hệ thống.
     * URL: GET /api/admin/messages/conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<AdminConversationDTO>> getConversations() {
        List<AdminConversationDTO> conversations = supabaseService.getAllConversations();
        return ResponseEntity.ok(conversations);
    }

    /**
     * Lấy danh sách tin nhắn chi tiết của một cuộc hội thoại theo ID.
     * URL: GET /api/admin/messages/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<List<AdminMessageDTO>> getMessages(@PathVariable String id) {
        List<AdminMessageDTO> messages = supabaseService.getMessages2(id);
        return ResponseEntity.ok(messages);
    }
}