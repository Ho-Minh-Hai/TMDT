package com.tmdt.service;

import com.tmdt.dto.ReviewRequestDTO;
import com.tmdt.model.Review;
import com.tmdt.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public Review createReview(ReviewRequestDTO dto, UUID reviewerId) {
        // Validate số sao
        if (dto.getRating() < 1 || dto.getRating() > 5) {
            throw new IllegalArgumentException("Số sao phải từ 1 đến 5");
        }

        // Chống spam rate liên tục
        if (reviewRepository.existsByProductIdAndReviewerId(dto.getProductId(), reviewerId)) {
            throw new IllegalStateException("Bạn đã đánh giá sản phẩm này rồi!");
        }

        // Tạo Entity mới
        Review review = new Review();
        review.setReviewerId(reviewerId);
        review.setProductId(dto.getProductId());
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());

        return reviewRepository.save(review);
    }

    public List<Review> getReviews(UUID productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }
}