package com.tmdt.dto;

import lombok.Data;

@Data
public class ReviewRequestDTO {

    private String productId; 
    private Integer rating;
    private String comment;
    private String mediaUrl;
}