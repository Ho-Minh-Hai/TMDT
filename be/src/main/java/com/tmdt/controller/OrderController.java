package com.tmdt.controller;

import com.tmdt.dto.OrderRequestDTO;
import com.tmdt.model.Order;
import com.tmdt.model.Product;
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
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final SupabaseService supabaseService;

    // Lấy lịch sử mua hàng của user đang đăng nhập
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập");
        
        List<Order> myOrders = supabaseService.getOrdersByBuyer(principal.getUserId());
        return ResponseEntity.ok(myOrders);
    }

    // API dành cho Người bán xác nhận giao dịch và tạo đơn cho Người mua
    @PostMapping("/seller-confirm/{productId}")
    public ResponseEntity<?> sellerConfirmSale(
            @PathVariable String productId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập");

        String buyerId = payload.get("buyerId");
        if (buyerId == null || buyerId.isEmpty()) {
            return ResponseEntity.badRequest().body("Thiếu ID người mua!");
        }

        try {
            // 1. Lấy thông tin sản phẩm
            Product product = supabaseService.getProduct(productId);
            if (product == null) return ResponseEntity.notFound().build();

            // 2. Chống gian lận: Chỉ CHỦ SẢN PHẨM mới có quyền gọi API này
            if (!product.getSellerId().equals(principal.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ người bán mới có quyền xác nhận giao dịch!");
            }

            // 3. (Tùy chọn) Chống người bán tự nhập ID của chính mình
            if (buyerId.equals(principal.getUserId())) {
                return ResponseEntity.badRequest().body("Bạn không thể tự bán cho chính mình!");
            }

            // 4. Tạo lịch sử mua hàng cho người mua
            Map<String, Object> orderData = new HashMap<>();
            orderData.put("buyer_id", buyerId);
            orderData.put("product_id", productId);
            orderData.put("amount", product.getPrice());
            orderData.put("status", "completed");

            Order savedOrder = supabaseService.createOrder(orderData);
            return ResponseEntity.ok(savedOrder);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }
}