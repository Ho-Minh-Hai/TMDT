package com.tmdt.controller;

import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/activity-logs")
@CrossOrigin(origins = "*")
public class ActivityLogController {

    @Autowired
    private SupabaseService supabaseService;

    @GetMapping
    public ResponseEntity<?> getActivityLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(supabaseService.getActivityLogs(page, limit));
    }
}
