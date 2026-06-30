package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserWarning {
    private String id;
    
    @JsonProperty("user_id")
    private String userId;
    
    private String reason;
    private String source; // 'keyword' or 'report'
    private String detail; // e.g. the offending comment content
    
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    // Helper field for displaying warned user name in grid
    private String userFullName;
}
