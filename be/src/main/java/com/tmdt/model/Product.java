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
public class Product {

    private String id;

    @JsonProperty("seller_id")
    private String sellerId;

    private String name;

    private String description;

    private BigDecimal price;

    private String category;

    private String condition;

    private Integer quantity;

    @JsonProperty("image_url")
    private String imageUrl;

    private String location;

    private OffsetDateTime deadline;

    private String status;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    @JsonProperty("updated_at")
    private OffsetDateTime updatedAt;
}
