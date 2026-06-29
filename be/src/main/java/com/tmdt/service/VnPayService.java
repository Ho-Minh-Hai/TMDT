package com.tmdt.service;

import com.tmdt.config.VnPayConfig;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class VnPayService {

    private final VnPayConfig vnPayConfig;
    private final SupabaseService supabaseService;

    // Bảng giá các gói VIP (đơn vị VND)
    private static final Map<String, Long> PLAN_PRICES = Map.of(
            "starter", 250000L,
            "popular", 370000L,
            "unlimited", 1250000L
    );

    private static final Map<String, String> PLAN_NAMES = Map.of(
            "starter", "Gói Starter (Boost 3)",
            "popular", "Gói Popular (Boost 5)",
            "unlimited", "Gói VIP Unlimited"
    );

    private static final Map<String, Integer> PLAN_BOOST_LIMITS = Map.of(
            "starter", 3,
            "popular", 5,
            "unlimited", 9999
    );

    public VnPayService(VnPayConfig vnPayConfig, SupabaseService supabaseService) {
        this.vnPayConfig = vnPayConfig;
        this.supabaseService = supabaseService;
    }

    /**
     * Tạo VNPay Payment URL và lưu pending record vào database.
     */
    public String createPaymentUrl(String planId, String userId, String ipAddress) {
        Long amount = PLAN_PRICES.get(planId);
        if (amount == null) {
            throw new RuntimeException("Invalid plan ID: " + planId);
        }

        // Tạo mã giao dịch duy nhất
        String vnpTxnRef = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + VnPayConfig.getRandomNumber(4);

        // VNPay yêu cầu amount * 100
        long vnpAmount = amount * 100;

        // Tạo SortedMap các tham số (sắp xếp theo thứ tự bảng chữ cái)
        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", VnPayConfig.VNP_VERSION);
        vnpParams.put("vnp_Command", VnPayConfig.VNP_COMMAND);
        vnpParams.put("vnp_TmnCode", vnPayConfig.getVnpTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode", VnPayConfig.VNP_CURR_CODE);
        vnpParams.put("vnp_TxnRef", vnpTxnRef);
        vnpParams.put("vnp_OrderInfo", "Thanh toan VIP " + planId + " - " + userId);
        vnpParams.put("vnp_OrderType", VnPayConfig.VNP_ORDER_TYPE);
        vnpParams.put("vnp_Locale", VnPayConfig.VNP_LOCALE);
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getVnpReturnUrl());
        vnpParams.put("vnp_IpAddr", ipAddress);
        LocalDateTime createDate = LocalDateTime.now();
        LocalDateTime expireDate = createDate.plusMinutes(15);
        vnpParams.put("vnp_CreateDate", createDate.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        vnpParams.put("vnp_ExpireDate", expireDate.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        // Build query string
        StringBuilder queryBuilder = new StringBuilder();
        StringBuilder hashDataBuilder = new StringBuilder();

        for (Map.Entry<String, String> entry : vnpParams.entrySet()) {
            if (hashDataBuilder.length() > 0) {
                hashDataBuilder.append("&");
                queryBuilder.append("&");
            }
            hashDataBuilder.append(entry.getKey()).append("=")
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8).replaceAll("\\+", "%20"));
            queryBuilder.append(entry.getKey()).append("=")
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8).replaceAll("\\+", "%20"));
        }

        String hashData = hashDataBuilder.toString();
        String vnpSecureHash = VnPayConfig.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData);

        queryBuilder.append("&vnp_SecureHash=").append(vnpSecureHash);

        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + queryBuilder.toString();

        // Lưu pending record vào database
        try {
            Map<String, Object> membershipData = new HashMap<>();
            membershipData.put("user_id", userId);
            membershipData.put("plan_id", planId);
            membershipData.put("plan_name", PLAN_NAMES.get(planId));
            membershipData.put("boost_limit", PLAN_BOOST_LIMITS.get(planId));
            membershipData.put("boosts_remaining", PLAN_BOOST_LIMITS.get(planId));
            membershipData.put("amount", amount);
            membershipData.put("vnp_txn_ref", vnpTxnRef);
            membershipData.put("payment_status", "pending");

            // Hạn dùng 30 ngày từ bây giờ
            java.time.OffsetDateTime expiresAt = java.time.OffsetDateTime.now().plusDays(30);
            membershipData.put("expires_at", expiresAt.toString());

            supabaseService.createVipMembership(membershipData);
            System.out.println("✓ Created pending VIP membership with txnRef: " + vnpTxnRef);
        } catch (Exception e) {
            System.err.println("✗ Failed to create pending VIP membership: " + e.getMessage());
            // Vẫn tiếp tục vì không muốn block thanh toán
        }

        return paymentUrl;
    }

    /**
     * Xử lý kết quả thanh toán từ VNPay Return URL.
     * Xác thực chữ ký + cập nhật trạng thái trong database.
     */
    public Map<String, Object> processVnPayReturn(Map<String, String> params) {
        Map<String, Object> result = new HashMap<>();

        // Lấy SecureHash từ params
        String vnpSecureHash = params.get("vnp_SecureHash");
        if (vnpSecureHash == null) {
            result.put("success", false);
            result.put("message", "Missing secure hash");
            return result;
        }

        // Loại bỏ vnp_SecureHash và vnp_SecureHashType khỏi params để tính lại hash
        Map<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        // Build hash data
        StringBuilder hashDataBuilder = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (hashDataBuilder.length() > 0) {
                hashDataBuilder.append("&");
            }
            hashDataBuilder.append(entry.getKey()).append("=")
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8).replaceAll("\\+", "%20"));
        }

        String calculatedHash = VnPayConfig.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashDataBuilder.toString());

        // So sánh chữ ký
        if (!calculatedHash.equalsIgnoreCase(vnpSecureHash)) {
            result.put("success", false);
            result.put("message", "Invalid signature");
            System.err.println("✗ VNPay signature mismatch!");
            System.err.println("  Calculated: " + calculatedHash);
            System.err.println("  Received:   " + vnpSecureHash);
            return result;
        }

        String vnpResponseCode = params.get("vnp_ResponseCode");
        String vnpTxnRef = params.get("vnp_TxnRef");
        String vnpTransactionNo = params.get("vnp_TransactionNo");

        if ("00".equals(vnpResponseCode)) {
            // Thanh toán thành công → cập nhật database
            try {
                Map<String, Object> updateData = new HashMap<>();
                updateData.put("payment_status", "success");
                updateData.put("vnp_transaction_no", vnpTransactionNo);

                Map<String, Object> membership = supabaseService.updateVipMembershipByTxnRef(vnpTxnRef, updateData);

                result.put("success", true);
                result.put("message", "Payment successful");
                result.put("membership", membership);
                System.out.println("✓ VNPay payment success for txnRef: " + vnpTxnRef);
            } catch (Exception e) {
                System.err.println("✗ Failed to update VIP membership after payment: " + e.getMessage());
                result.put("success", false);
                result.put("message", "Payment confirmed but failed to update membership");
            }
        } else {
            // Thanh toán thất bại → cập nhật status
            try {
                Map<String, Object> updateData = new HashMap<>();
                updateData.put("payment_status", "failed");
                supabaseService.updateVipMembershipByTxnRef(vnpTxnRef, updateData);
            } catch (Exception e) {
                System.err.println("✗ Failed to update failed payment status: " + e.getMessage());
            }

            result.put("success", false);
            result.put("message", "Payment failed with response code: " + vnpResponseCode);
            System.out.println("✗ VNPay payment failed for txnRef: " + vnpTxnRef + ", code: " + vnpResponseCode);
        }

        return result;
    }
}
