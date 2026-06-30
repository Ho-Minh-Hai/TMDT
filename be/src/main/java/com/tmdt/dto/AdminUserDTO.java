package com.tmdt.dto;

import lombok.Data;

@Data
public class AdminUserDTO {
    private String id;
    private String fullName;
    private String role;
    private String avatarUrl;
    private String phone;
    private String isDelete;
    private String createdAt;
    private long warningCount;
}