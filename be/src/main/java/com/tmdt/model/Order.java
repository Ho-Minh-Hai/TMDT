package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Order {
    private String id;
    
    @JsonProperty("buyer_id")
    private String buyerId;
    
    @JsonProperty("product_id")
    private String productId;
    
    private Double amount;
    private String status;
    
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    // Supabase sẽ tự động JOIN và nhét thông tin sản phẩm vào biến này!
    @JsonProperty("products")
    private Product product;
}