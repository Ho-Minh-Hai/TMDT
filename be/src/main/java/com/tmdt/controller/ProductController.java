package com.tmdt.controller;

import com.tmdt.dto.ProductRequest;
import com.tmdt.model.Product;
import com.tmdt.security.UserPrincipal;
import com.tmdt.service.SupabaseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final SupabaseService supabaseService;

    public ProductController(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    @GetMapping
    public ResponseEntity<?> getProducts(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            // Verify user role
            Map<String, Object> profile = supabaseService.getProfile(principal.getUserId());
            if (profile == null || !"user".equals(profile.get("role"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only users can access this resource"));
            }

            List<Product> products = supabaseService.getProductsBySeller(principal.getUserId());
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch products: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProduct(@PathVariable String id,
                                         @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Product product = supabaseService.getProduct(id);
            if (product == null) {
                return ResponseEntity.notFound().build();
            }
            // Verify ownership
            if (!product.getSellerId().equals(principal.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only view your own products"));
            }
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch product: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductRequest request,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            // Verify user role
            Map<String, Object> profile = supabaseService.getProfile(principal.getUserId());
            if (profile == null || !"user".equals(profile.get("role"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only users can create products"));
            }

            Map<String, Object> productData = buildProductMap(request, principal.getUserId());
            Product created = supabaseService.createProduct(productData);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create product: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable String id,
                                            @Valid @RequestBody ProductRequest request,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            // Verify ownership
            Product existing = supabaseService.getProduct(id);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }
            if (!existing.getSellerId().equals(principal.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only edit your own products"));
            }

            Map<String, Object> productData = buildProductMap(request, null);
            productData.put("updated_at", OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            Product updated = supabaseService.updateProduct(id, productData);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update product: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable String id,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            // Verify ownership
            Product existing = supabaseService.getProduct(id);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }
            if (!existing.getSellerId().equals(principal.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only delete your own products"));
            }

            supabaseService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete product: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable String id,
                                           @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Product existing = supabaseService.getProduct(id);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }
            if (!existing.getSellerId().equals(principal.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only update your own products"));
            }

            String newStatus = "available".equals(existing.getStatus()) ? "sold" : "available";
            Map<String, Object> data = new HashMap<>();
            data.put("status", newStatus);
            data.put("updated_at", OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

            Product updated = supabaseService.updateProduct(id, data);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to toggle status: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "File is empty"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Only image files are allowed"));
            }

            String imageUrl = supabaseService.uploadImage(file, principal.getUserId());
            return ResponseEntity.ok(Map.of("url", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    // ==================== HELPERS ====================

    private Map<String, Object> buildProductMap(ProductRequest request, String sellerId) {
        Map<String, Object> data = new LinkedHashMap<>();
        if (sellerId != null) {
            data.put("seller_id", sellerId);
        }
        data.put("name", request.getName());
        data.put("description", request.getDescription());
        data.put("price", request.getPrice());
        data.put("category", request.getCategory());
        data.put("condition", request.getCondition() != null ? request.getCondition() : "new");
        data.put("quantity", request.getQuantity() != null ? request.getQuantity() : 1);
        data.put("image_url", request.getImageUrl());
        data.put("location", request.getLocation());
        if (request.getDeadline() != null && !request.getDeadline().isEmpty()) {
            data.put("deadline", request.getDeadline());
        }
        data.put("status", request.getStatus() != null ? request.getStatus() : "available");
        return data;
    }
}
