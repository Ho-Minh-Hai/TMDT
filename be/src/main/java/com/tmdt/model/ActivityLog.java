package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ActivityLog {
    private String id;
    
    @JsonProperty("user_id")
    private String userId;
    
    private String action; // 'post_product', 'comment', 'update_product', 'delete_product'
    
    @JsonProperty("target_type")
    private String targetType; // 'product', 'review'
    
    @JsonProperty("target_id")
    private String targetId;
    
    private String detail;
    
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    // Field helper for displaying user full name in activity log feed
    private String userFullName;
}
