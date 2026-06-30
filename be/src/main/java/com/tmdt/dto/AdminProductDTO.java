package com.tmdt.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminProductDTO {
    private String id;
    private String name;
    private BigDecimal price;
    private String imageUrl;
    private String status;
    private LocalDateTime createdAt;
    
    // Thông tin người bán được join từ bảng profiles thông qua seller_id
    private String sellerId;
    private String sellerName;
    private String sellerAvatar;
}