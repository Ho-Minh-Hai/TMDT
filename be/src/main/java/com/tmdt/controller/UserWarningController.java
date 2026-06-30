package com.tmdt.controller;

import com.tmdt.model.UserWarning;
import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/warnings")
@CrossOrigin(origins = "*")
public class UserWarningController {

    @Autowired
    private SupabaseService supabaseService;

    @GetMapping
    public ResponseEntity<List<UserWarning>> getAllWarnings() {
        return ResponseEntity.ok(supabaseService.getAllUserWarnings());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserWarning>> getWarningsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(supabaseService.getUserWarnings(userId));
    }

    @GetMapping("/count/{userId}")
    public ResponseEntity<?> getWarningCount(@PathVariable String userId) {
        long count = supabaseService.getUserWarningCount(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "count", count));
    }
}
