package com.tmdt.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name must be less than 255 characters")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @Size(max = 100, message = "Category must be less than 100 characters")
    private String category;

    @Size(max = 50, message = "Condition must be less than 50 characters")
    private String condition;

    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;

    private String imageUrl;

    @Size(max = 255, message = "Location must be less than 255 characters")
    private String location;

    private String deadline;

    @Size(max = 50, message = "Status must be less than 50 characters")
    private String status;
}
