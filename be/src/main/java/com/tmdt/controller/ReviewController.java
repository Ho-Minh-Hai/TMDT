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

            // 3. Kiểm tra từ khóa cấm và chuẩn bị comment đã lọc
            String originalComment = dto.getComment();
            boolean isViolating = supabaseService.checkBannedKeywords(originalComment);
            String filteredComment = supabaseService.filterBannedKeywords(originalComment);

            // 4. Chuẩn bị Map dữ liệu để gửi sang Supabase
            Map<String, Object> reviewData = new HashMap<>();
            reviewData.put("reviewer_id", reviewerId);
            reviewData.put("product_id", dto.getProductId());
            reviewData.put("rating", dto.getRating());
            reviewData.put("comment", filteredComment);
            reviewData.put("media_url", dto.getMediaUrl());

            // 5. Gọi Service tạo Review
            Review savedReview = supabaseService.createReview(reviewData);

            if (savedReview == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi tạo đánh giá!");
            }

            // 6. Kiểm tra từ khóa cấm và tạo cảnh cáo
            if (isViolating) {
                supabaseService.createUserWarning(reviewerId, "Vi phạm từ khóa cấm", "keyword", originalComment);
            }

            // 7. Ghi nhật ký hoạt động
            supabaseService.createActivityLog(reviewerId, "comment", "review", savedReview.getId(), 
                "Đã đăng đánh giá " + dto.getRating() + " sao: \"" + originalComment + "\"");

            // 8. Trả về payload kèm flag warning
            Map<String, Object> responsePayload = new HashMap<>();
            responsePayload.put("id", savedReview.getId());
            responsePayload.put("reviewer_id", savedReview.getReviewerId());
            responsePayload.put("product_id", savedReview.getProductId());
            responsePayload.put("rating", savedReview.getRating());
            responsePayload.put("comment", savedReview.getComment());
            responsePayload.put("created_at", savedReview.getCreatedAt());
            responsePayload.put("updated_at", savedReview.getUpdatedAt());
            responsePayload.put("media_url", savedReview.getMediaUrl());
            responsePayload.put("warning", isViolating);

            return ResponseEntity.ok(responsePayload);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }
    // API Xóa đánh giá
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable String reviewId, @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập");

        Review review = supabaseService.getReviewById(reviewId);
        if (review == null) return ResponseEntity.notFound().build();
        if (!review.getReviewerId().equals(principal.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền xóa đánh giá của người khác");
        }

        supabaseService.deleteReview(reviewId);
        return ResponseEntity.ok("Xóa thành công");
    }

    // API Sửa đánh giá
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @PathVariable String reviewId,
            @RequestBody ReviewRequestDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập");

        Review review = supabaseService.getReviewById(reviewId);
        if (review == null) return ResponseEntity.notFound().build();
        if (!review.getReviewerId().equals(principal.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền sửa đánh giá này");
        }

        // 1. Kiểm tra từ khóa cấm và chuẩn bị comment đã lọc
        String originalComment = dto.getComment();
        boolean isViolating = supabaseService.checkBannedKeywords(originalComment);
        String filteredComment = supabaseService.filterBannedKeywords(originalComment);

        Map<String, Object> updateData = new HashMap<>();
        updateData.put("rating", dto.getRating());
        updateData.put("comment", filteredComment);
        updateData.put("media_url", dto.getMediaUrl());
        updateData.put("updated_at", java.time.OffsetDateTime.now().toString());

        Review updatedReview = supabaseService.updateReview(reviewId, updateData);
        if (updatedReview == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi cập nhật đánh giá!");
        }

        // 2. Tạo cảnh cáo nếu vi phạm
        if (isViolating) {
            supabaseService.createUserWarning(principal.getUserId(), "Vi phạm từ khóa cấm khi sửa bình luận", "keyword", originalComment);
        }

        // 3. Ghi nhật ký hoạt động
        supabaseService.createActivityLog(principal.getUserId(), "comment", "review", reviewId, 
            "Đã sửa đánh giá: \"" + originalComment + "\"");

        // 4. Trả về payload kèm flag warning
        Map<String, Object> responsePayload = new HashMap<>();
        responsePayload.put("id", updatedReview.getId());
        responsePayload.put("reviewer_id", updatedReview.getReviewerId());
        responsePayload.put("product_id", updatedReview.getProductId());
        responsePayload.put("rating", updatedReview.getRating());
        responsePayload.put("comment", updatedReview.getComment());
        responsePayload.put("created_at", updatedReview.getCreatedAt());
        responsePayload.put("updated_at", updatedReview.getUpdatedAt());
        responsePayload.put("media_url", updatedReview.getMediaUrl());
        responsePayload.put("warning", isViolating);

        return ResponseEntity.ok(responsePayload);
    }
}