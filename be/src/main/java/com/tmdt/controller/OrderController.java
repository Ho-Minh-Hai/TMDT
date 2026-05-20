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

    // API dành cho Người mua xác nhận đã nhận hàng bằng tiền mặt
    @PostMapping("/confirm-purchase/{productId}")
    public ResponseEntity<?> confirmPurchase(@PathVariable String productId, @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập");

        try {
            // 1. Lấy thông tin sản phẩm
            Product product = supabaseService.getProduct(productId);
            if (product == null) return ResponseEntity.notFound().build();

            // 2. Chống gian lận: Chỉ cho phép xác nhận mua khi người bán ĐÃ đánh dấu 'sold'
            if (!"sold".equals(product.getStatus())) {
                return ResponseEntity.badRequest().body("Người bán chưa xác nhận bán sản phẩm này!");
            }

            // 3. Chống gian lận: Không cho phép người bán tự mua hàng của mình
            if (product.getSellerId().equals(principal.getUserId())) {
                return ResponseEntity.badRequest().body("Bạn không thể tự mua sản phẩm của chính mình!");
            }

            // 4. Tạo lịch sử mua hàng
            Map<String, Object> orderData = new HashMap<>();
            orderData.put("buyer_id", principal.getUserId());
            orderData.put("product_id", productId);
            orderData.put("amount", product.getPrice());
            orderData.put("status", "completed"); // Đã giao dịch tiền mặt xong

            Order savedOrder = supabaseService.createOrder(orderData);
            return ResponseEntity.ok(savedOrder);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }
}