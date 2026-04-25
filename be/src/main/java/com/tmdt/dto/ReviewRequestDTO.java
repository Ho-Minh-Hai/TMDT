package com.tmdt.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ReviewRequestDTO {
    private UUID productId;
    private Integer rating;
    private String comment;
}