package com.tmdt.controller;

import com.tmdt.service.SupabaseService;
import com.tmdt.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final VnPayService vnPayService;
    private final SupabaseService supabaseService;

    public PaymentController(VnPayService vnPayService, SupabaseService supabaseService) {
        this.vnPayService = vnPayService;
        this.supabaseService = supabaseService;
    }

    /**
     * Tạo URL thanh toán VNPay.
     * POST /api/payment/create-vnpay-url
     * Body: { "planId": "starter", "userId": "uuid..." }
     */
    @PostMapping("/create-vnpay-url")
    public ResponseEntity<?> createVnPayUrl(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            String planId = request.get("planId");
            String userId = request.get("userId");

            if (planId == null || userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "planId and userId are required"));
            }

            // Lấy IP address của client
            String ipAddress = getClientIpAddress(httpRequest); 

            String paymentUrl = vnPayService.createPaymentUrl(planId, userId, ipAddress);

            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", paymentUrl);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to create payment URL: " + e.getMessage()));
        }
    }

    /**
     * Xử lý kết quả thanh toán từ VNPay redirect.
     * GET /api/payment/vnpay-return?vnp_Amount=...&vnp_ResponseCode=...&...
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<?> vnPayReturn(@RequestParam Map<String, String> params) {
        try {
            Map<String, Object> result = vnPayService.processVnPayReturn(params);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Error processing payment: " + e.getMessage()));
        }
    }

    /**
     * Lấy VIP membership đang active của user.
     * GET /api/payment/vip-membership/{userId}
     */
    @GetMapping("/vip-membership/{userId}")
    public ResponseEntity<?> getVipMembership(@PathVariable String userId) {
        try {
            Map<String, Object> membership = supabaseService.getActiveVipMembership(userId);
            if (membership == null) {
                return ResponseEntity.ok(Map.of("active", false));
            }
            Map<String, Object> response = new HashMap<>();
            response.put("active", true);
            response.put("membership", membership);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to get VIP membership: " + e.getMessage()));
        }
    }

    /**
     * Hủy VIP membership.
     * DELETE /api/payment/vip-membership/{membershipId}
     */
    @DeleteMapping("/vip-membership/{membershipId}")
    public ResponseEntity<?> cancelVipMembership(@PathVariable String membershipId) {
        try {
            supabaseService.deleteVipMembership(membershipId);
            return ResponseEntity.ok(Map.of("success", true, "message", "VIP membership cancelled"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to cancel VIP membership: " + e.getMessage()));
        }
    }

    /**
     * Lấy IP address thực của client (hỗ trợ proxy/forwarded).
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
                "X-Forwarded-For",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_X_FORWARDED_FOR",
                "HTTP_CLIENT_IP"
        };

        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For có thể chứa nhiều IP, lấy cái đầu tiên
                return ip.split(",")[0].trim();
            }
        }

        return request.getRemoteAddr();
    }
}
