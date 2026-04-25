package com.tmdt.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    private UUID id;
    private UUID user1_id;
    private UUID user2_id;
    private OffsetDateTime created_at;
    private OffsetDateTime updated_at;
}
