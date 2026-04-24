package com.tmdt.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tmdt.model.Product;
import com.tmdt.model.Conversation;
import com.tmdt.model.Message;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class SupabaseService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseServiceKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public SupabaseService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // ==================== PRODUCT CRUD ====================

    public List<Product> getProductsBySeller(String sellerId) {
        String url = supabaseUrl + "/rest/v1/products?seller_id=eq." + sellerId + "&order=created_at.desc";

        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class
        );

        try {
            return objectMapper.readValue(response.getBody(), new TypeReference<List<Product>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse products", e);
        }
    }

    public Product getProduct(String productId) {
        String url = supabaseUrl + "/rest/v1/products?id=eq." + productId;

        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class
        );

        try {
            List<Product> products = objectMapper.readValue(response.getBody(), new TypeReference<List<Product>>() {});
            return products.isEmpty() ? null : products.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse product", e);
        }
    }

    public Product createProduct(Map<String, Object> productData) {
        String url = supabaseUrl + "/rest/v1/products";

        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=representation");

        try {
            String body = objectMapper.writeValueAsString(productData);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class
            );

            List<Product> products = objectMapper.readValue(response.getBody(), new TypeReference<List<Product>>() {});
            return products.isEmpty() ? null : products.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create product: " + e.getMessage(), e);
        }
    }

    public Product updateProduct(String productId, Map<String, Object> productData) {
        String url = supabaseUrl + "/rest/v1/products?id=eq." + productId;

        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=representation");

        try {
            String body = objectMapper.writeValueAsString(productData);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.PATCH, new HttpEntity<>(body, headers), String.class
            );

            List<Product> products = objectMapper.readValue(response.getBody(), new TypeReference<List<Product>>() {});
            return products.isEmpty() ? null : products.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update product: " + e.getMessage(), e);
        }
    }

    public void deleteProduct(String productId) {
        String url = supabaseUrl + "/rest/v1/products?id=eq." + productId;

        HttpHeaders headers = createHeaders();

        restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), String.class);
    }

    // ==================== FILE UPLOAD ====================

    public String uploadImage(MultipartFile file, String sellerId) {
        String fileName = sellerId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        String url = supabaseUrl + "/storage/v1/object/product-images/" + fileName;

        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : "application/octet-stream"
        ));

        try {
            byte[] fileBytes = file.getBytes();
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(fileBytes, headers), String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                // Return the public URL
                return supabaseUrl + "/storage/v1/object/public/product-images/" + fileName;
            }
            throw new RuntimeException("Upload failed with status: " + response.getStatusCode());
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    // ==================== PROFILES ====================

    public Map<String, Object> getProfile(String userId) {
        String url = supabaseUrl + "/rest/v1/profiles?id=eq." + userId;

        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class
        );

        try {
            List<Map<String, Object>> profiles = objectMapper.readValue(
                    response.getBody(), new TypeReference<List<Map<String, Object>>>() {}
            );
            return profiles.isEmpty() ? null : profiles.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get profile", e);
        }
    }

    // ==================== CHAT ====================

    public List<Conversation> getConversations(String userId) {
        String url = supabaseUrl + "/rest/v1/conversations?or=(user1_id.eq." + userId + ",user2_id.eq." + userId + ")&order=updated_at.desc";
        
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class
        );

        try {
            return objectMapper.readValue(response.getBody(), new TypeReference<List<Conversation>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to get conversations", e);
        }
    }

    public Conversation getOrCreateConversation(String user1Id, String user2Id) {
        // Tìm hội thoại hiện có
        String url = supabaseUrl + "/rest/v1/conversations?or=(and(user1_id.eq." + user1Id + ",user2_id.eq." + user2Id + "),and(user1_id.eq." + user2Id + ",user2_id.eq." + user1Id + "))";
        
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class
        );

        try {
            List<Conversation> list = objectMapper.readValue(response.getBody(), new TypeReference<List<Conversation>>() {});
            if (!list.isEmpty()) return list.get(0);

            // Nếu không có, tạo mới
            String postUrl = supabaseUrl + "/rest/v1/conversations";
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Prefer", "return=representation");

            Map<String, String> body = new HashMap<>();
            body.put("user1_id", user1Id);
            body.put("user2_id", user2Id);

            ResponseEntity<String> postRes = restTemplate.exchange(
                    postUrl, HttpMethod.POST, new HttpEntity<>(objectMapper.writeValueAsString(body), headers), String.class
            );

            List<Conversation> created = objectMapper.readValue(postRes.getBody(), new TypeReference<List<Conversation>>() {});
            return created.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get or create conversation", e);
        }
    }

    public List<Message> getMessages(String conversationId) {
        String url = supabaseUrl + "/rest/v1/messages?conversation_id=eq." + conversationId + "&order=created_at.asc";
        
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class
        );

        try {
            return objectMapper.readValue(response.getBody(), new TypeReference<List<Message>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to get messages", e);
        }
    }

    public Message createMessage(Map<String, Object> messageData) {
        String url = supabaseUrl + "/rest/v1/messages";

        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=representation");

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(objectMapper.writeValueAsString(messageData), headers), String.class
            );

            // Cập nhật updated_at cho conversation
            String convId = messageData.get("conversation_id").toString();
            updateConversationTime(convId);

            List<Message> messages = objectMapper.readValue(response.getBody(), new TypeReference<List<Message>>() {});
            return messages.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create message", e);
        }
    }

    private void updateConversationTime(String convId) {
        String url = supabaseUrl + "/rest/v1/conversations?id=eq." + convId;
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, String> body = new HashMap<>();
        body.put("updated_at", java.time.OffsetDateTime.now().toString());

        try {
            restTemplate.exchange(url, HttpMethod.PATCH, new HttpEntity<>(objectMapper.writeValueAsString(body), headers), String.class);
        } catch (Exception ignored) {}
    }

    // ==================== HELPERS ====================

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        return headers;
    }
}
