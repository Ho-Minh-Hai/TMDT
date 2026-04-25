package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Review {
    private String id;

    @JsonProperty("reviewer_id")
    private String reviewerId;

    @JsonProperty("product_id")
    private String productId;

    private Integer rating;
    private String comment;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}