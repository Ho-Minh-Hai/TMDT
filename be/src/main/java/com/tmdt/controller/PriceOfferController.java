package com.tmdt.controller;

import com.tmdt.model.PriceOffer;
import com.tmdt.service.SupabaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/offers")
public class PriceOfferController {

    private final SupabaseService supabaseService;

    public PriceOfferController(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    /**
     * Tạo offer mới (người mua gửi đề xuất giá)
     * Body: { product_id, conversation_id, buyer_id, seller_id, original_price,
     * offer_price }
     */
    @PostMapping
    public ResponseEntity<?> createOffer(@RequestBody Map<String, Object> body) {
        try {
            PriceOffer offer = supabaseService.createPriceOffer(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(offer);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể tạo offer: " + e.getMessage()));
        }
    }

    /**
     * Lấy offer theo conversation_id
     */
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<?> getOfferByConversation(@PathVariable String conversationId) {
        try {
            List<PriceOffer> offers = supabaseService.getOffersByConversation(conversationId);
            // Trả về offer mới nhất còn active (pending hoặc buyer_confirmed)
            PriceOffer active = offers.stream()
                    .filter(o -> "pending".equals(o.getStatus())
                            || "buyer_confirmed".equals(o.getStatus())
                            || "seller_confirmed".equals(o.getStatus()))
                    .findFirst()
                    .orElse(null);
            return ResponseEntity.ok(active);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể lấy offer: " + e.getMessage()));
        }
    }

    /**
     * Xác nhận deal (một trong hai bên tick xác nhận)
     * Body: { user_id } — user_id là người đang bấm confirm
     */
    @PostMapping("/{offerId}/confirm")
    public ResponseEntity<?> confirmOffer(@PathVariable String offerId,
            @RequestBody Map<String, Object> body) {
        try {
            String userId = (String) body.get("user_id");
            PriceOffer result = supabaseService.confirmPriceOffer(offerId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể xác nhận offer: " + e.getMessage()));
        }
    }

    /**
     * Từ chối / hủy offer
     */
    @PostMapping("/{offerId}/reject")
    public ResponseEntity<?> rejectOffer(@PathVariable String offerId) {
        try {
            supabaseService.rejectPriceOffer(offerId);
            return ResponseEntity.ok(Map.of("message", "Offer đã bị hủy"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể hủy offer: " + e.getMessage()));
        }
    }
}
