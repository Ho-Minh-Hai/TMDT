package com.tmdt.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Note {
    private String id;
    
    @JsonProperty("user_id")
    private String userId;
    
    private String title;
    private String content;
    private String deadline;
    private String status;
    
    @JsonProperty("created_at")
    private String createdAt;

    public Note() {}

    public Note(String userId, String title, String content, String deadline) {
        this.userId = userId;
        this.title = title;
        this.content = content;
        this.deadline = deadline;
        this.status = "pending";
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
