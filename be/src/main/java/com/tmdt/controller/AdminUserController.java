package com.tmdt.controller;

import com.tmdt.dto.PageResponseDTO;
import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    @Autowired
    private SupabaseService supabaseService;

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(supabaseService.getAdminUsers(page, limit));
    }

    @PatchMapping("/{id}/toggle-lock")
    public ResponseEntity<?> toggleUserLock(
            @PathVariable String id,
            @RequestParam String status) {
        try {
            supabaseService.toggleUserLock(id, status);
            String msg = status.equals("1") ? "Khóa tài khoản thành công" : "Mở khóa tài khoản thành công";
            return ResponseEntity.ok(Map.of("message", msg));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}