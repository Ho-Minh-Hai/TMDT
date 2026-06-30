package com.tmdt.controller;

import com.tmdt.model.Report;
import com.tmdt.model.UserWarning;
import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private SupabaseService supabaseService;

    @GetMapping
    public ResponseEntity<List<Report>> getReports() {
        return ResponseEntity.ok(supabaseService.getAllReports());
    }

    @PostMapping("/{reportId}/approve")
    public ResponseEntity<UserWarning> approveReport(@PathVariable String reportId) {
        UserWarning warning = supabaseService.approveReport(reportId);
        return ResponseEntity.ok(warning);
    }
}
