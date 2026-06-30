package com.tmdt.controller;

import com.tmdt.model.BannedKeyword;
import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/banned-keywords")
@CrossOrigin(origins = "*")
public class BannedKeywordController {

    @Autowired
    private SupabaseService supabaseService;

    @GetMapping
    public ResponseEntity<List<BannedKeyword>> getKeywords() {
        return ResponseEntity.ok(supabaseService.getBannedKeywords());
    }

    @PostMapping
    public ResponseEntity<?> addKeyword(@RequestBody Map<String, String> payload) {
        String keyword = payload.get("keyword");
        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Keyword cannot be empty"));
        }
        try {
            BannedKeyword created = supabaseService.createBannedKeyword(keyword.trim());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteKeyword(@PathVariable String id) {
        try {
            supabaseService.deleteBannedKeyword(id);
            return ResponseEntity.ok(Map.of("message", "Keyword deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
