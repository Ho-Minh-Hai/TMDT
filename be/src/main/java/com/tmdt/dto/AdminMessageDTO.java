package com.tmdt.dto;

import java.time.LocalDateTime;

/**
 * DTO đại diện cho chi tiết từng tin nhắn trong cuộc trò chuyện.
 */
public record AdminMessageDTO(
    String id,            // ID của tin nhắn (từ bảng messages)
    String senderId,      // ID của người gửi (để phân biệt trái/phải trên UI)
    String content,       // Nội dung tin nhắn văn bản
    LocalDateTime createdAt // Thời điểm gửi tin nhắn
) {}