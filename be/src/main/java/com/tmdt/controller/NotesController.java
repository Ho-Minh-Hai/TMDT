package com.tmdt.controller;

import com.tmdt.model.Note;
import com.tmdt.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class NotesController {

    @Autowired
    private SupabaseService supabaseService;

    @PostMapping
    public ResponseEntity<?> createNote(@RequestBody Map<String, Object> noteData) {
        try {
            // Ensure content is never null
            if (noteData.get("content") == null || noteData.get("content").equals("")) {
                noteData.put("content", "");
            }
            
            Note note = supabaseService.createNote(noteData);
            return ResponseEntity.status(HttpStatus.CREATED).body(note);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pending/{userId}")
    public ResponseEntity<?> getPendingNotes(@PathVariable String userId) {
        try {
            List<Note> notes = supabaseService.getPendingNotes(userId);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{noteId}")
    public ResponseEntity<?> updateNote(@PathVariable String noteId, @RequestBody Map<String, Object> noteData) {
        try {
            Note note = supabaseService.updateNote(noteId, noteData);
            return ResponseEntity.ok(note);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
