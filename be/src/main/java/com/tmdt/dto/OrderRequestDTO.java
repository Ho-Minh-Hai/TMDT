package com.tmdt.dto;

import lombok.Data;

@Data
public class OrderRequestDTO {
    private String productId;
    private Double amount;
}