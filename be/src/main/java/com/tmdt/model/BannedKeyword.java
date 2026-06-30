package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class BannedKeyword {
    private String id;
    private String keyword;
    
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;
}
