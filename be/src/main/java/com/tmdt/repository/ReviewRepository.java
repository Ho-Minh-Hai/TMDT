package com.tmdt.repository;

import com.tmdt.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    
    // Tìm danh sách đánh giá của 1 sản phẩm
    List<Review> findByProductIdOrderByCreatedAtDesc(UUID productId);
    
    // Chống spam: Kiểm tra xem user này đã đánh giá sản phẩm này chưa
    boolean existsByProductIdAndReviewerId(UUID productId, UUID reviewerId);
}