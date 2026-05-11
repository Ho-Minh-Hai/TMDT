package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Review {

    private String id;

    @JsonProperty("reviewer_id")
    private String reviewerId;

    @JsonProperty("product_id")
    private String productId;

    private Integer rating;
    private String comment;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    @JsonProperty("updated_at")
    private OffsetDateTime updatedAt;
    @JsonProperty("media_url")
    private String mediaUrl;
}