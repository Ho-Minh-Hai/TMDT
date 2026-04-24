package com.tmdt.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    private UUID id;
    private UUID conversation_id;
    private UUID sender_id;
    private String content;
    private String message_type;
    private OffsetDateTime created_at;
    private OffsetDateTime read_at;
}
