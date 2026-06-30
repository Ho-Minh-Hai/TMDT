package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Report {
    private String id;

    @JsonProperty("reporter_id")
    private String reporterId;

    @JsonProperty("reported_user_id")
    private String reportedUserId;

    private String reason;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    private String reporterFullName;
    private String reportedUserFullName;
}
