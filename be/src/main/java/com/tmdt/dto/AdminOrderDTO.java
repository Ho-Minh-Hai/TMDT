package com.tmdt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderDTO {
    private String id;
    private String buyerId;
    private String buyerName;
    private String buyerAvatar;
    private String productId;
    private String productName;
    private String productImage;
    private Double amount;
    private String status;
    private String createdAt;
}
