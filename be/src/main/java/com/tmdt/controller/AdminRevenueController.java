package com.tmdt.controller;

import com.tmdt.service.SupabaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/revenue")
public class AdminRevenueController {

    private final SupabaseService supabaseService;

    public AdminRevenueController(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    @GetMapping("/vip-memberships")
    public ResponseEntity<?> getVipRevenueByYear(@RequestParam int year) {
        return ResponseEntity.ok(supabaseService.getVipRevenueByYear(year));
    }
}