package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PriceOffer {

    private String id;

    @JsonProperty("product_id")
    private String productId;

    @JsonProperty("conversation_id")
    private String conversationId;

    @JsonProperty("buyer_id")
    private String buyerId;

    @JsonProperty("seller_id")
    private String sellerId;

    @JsonProperty("original_price")
    private BigDecimal originalPrice;

    @JsonProperty("offer_price")
    private BigDecimal offerPrice;

    // pending | buyer_confirmed | seller_confirmed | accepted | rejected
    private String status;

    @JsonProperty("initiated_by")
    private String initiatedBy;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    @JsonProperty("updated_at")
    private OffsetDateTime updatedAt;
}
