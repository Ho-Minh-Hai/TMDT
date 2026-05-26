package com.tmdt.dto;

import java.time.LocalDateTime;

/**
 * DTO đại diện cho danh sách hộp thư trong giao diện Admin.
 * Chứa thông tin của cả 2 người dùng tham gia hội thoại.
 */
public record AdminConversationDTO(
    String id,            // ID của cuộc hội thoại (từ bảng conversations)
    String user1Id,       // ID người dùng thứ nhất
    String user1Name,     // Tên hiển thị người dùng 1
    String user1Avatar,   // Ảnh đại diện người dùng 1
    String user2Id,       // ID người dùng thứ hai
    String user2Name,     // Tên hiển thị người dùng 2
    String user2Avatar,   // Ảnh đại diện người dùng 2
    String lastMessage,   // Nội dung tin nhắn cuối cùng để hiển thị preview
    LocalDateTime updatedAt // Thời gian cập nhật cuối cùng để sắp xếp
) {}