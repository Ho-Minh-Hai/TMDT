package com.tmdt.controller;

import com.tmdt.dto.ReviewRequestDTO;
import com.tmdt.model.Review;
import com.tmdt.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*") // Fix lỗi CORS cho React gọi qua
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // API: Lấy danh sách đánh giá của 1 sản phẩm
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable UUID productId) {
        return ResponseEntity.ok(reviewService.getReviews(productId));
    }

    // API: Đăng đánh giá
    @PostMapping
    public ResponseEntity<?> addReview(
            @RequestBody ReviewRequestDTO requestDTO,
            @AuthenticationPrincipal Jwt jwt
    ) {
        try {
            // Lấy ID user từ token và ép sang chuẩn UUID
            UUID supabaseUserId = UUID.fromString(jwt.getClaimAsString("sub")); 
            
            Review savedReview = reviewService.createReview(requestDTO, supabaseUserId);
            return ResponseEntity.ok(savedReview);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }
}