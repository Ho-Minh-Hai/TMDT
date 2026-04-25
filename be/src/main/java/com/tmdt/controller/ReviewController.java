package com.tmdt.controller;

import com.tmdt.dto.ReviewRequestDTO;
import com.tmdt.model.Review;
import com.tmdt.security.UserPrincipal;
import com.tmdt.service.SupabaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final SupabaseService supabaseService;

    // Lấy danh sách (Public - Ai cũng xem được)
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable String productId) {
        return ResponseEntity.ok(supabaseService.getReviewsByProduct(productId));
    }

    // Đăng đánh giá (Yêu cầu có Token)
    @PostMapping
    public ResponseEntity<?> addReview(
            @RequestBody ReviewRequestDTO dto,
            @AuthenticationPrincipal UserPrincipal principal // Lấy trực tiếp từ Filter của bạn!
    ) {
        try {
            // 1. Kiểm tra đăng nhập
            if (principal == null || principal.getUserId() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Bạn cần đăng nhập để đánh giá!");
            }
            
            String reviewerId = principal.getUserId();

            // 2. Validate dữ liệu
            if (dto.getRating() < 1 || dto.getRating() > 5) {
                return ResponseEntity.badRequest().body("Số sao phải từ 1 đến 5");
            }
            if (supabaseService.hasUserReviewedProduct(dto.getProductId(), reviewerId)) {
                return ResponseEntity.badRequest().body("Bạn đã đánh giá sản phẩm này rồi!");
            }

            // 3. Chuẩn bị Map dữ liệu để gửi sang Supabase
            Map<String, Object> reviewData = new HashMap<>();
            reviewData.put("reviewer_id", reviewerId);
            reviewData.put("product_id", dto.getProductId());
            reviewData.put("rating", dto.getRating());
            reviewData.put("comment", dto.getComment());

            // 4. Gọi Service tạo Review
            Review savedReview = supabaseService.createReview(reviewData);
            return ResponseEntity.ok(savedReview);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }
}