package com.tmdt.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tmdt.model.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.JsonNode;
import com.tmdt.dto.AdminConversationDTO;
import com.tmdt.dto.AdminMessageDTO;
import com.tmdt.dto.AdminProductDTO;
import com.tmdt.dto.AdminUserDTO;
import com.tmdt.dto.PageResponseDTO;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class SupabaseService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseServiceKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public SupabaseService() {
        this.restTemplate = new RestTemplate();
        this.restTemplate.setRequestFactory(new org.springframework.http.client.JdkClientHttpRequestFactory());
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // ==================== PRODUCT CRUD ====================

    public List<Product> getProductsBySeller(String sellerId) {
        String url = supabaseUrl + "/rest/v1/products?seller_id=eq." + sellerId + "&order=created_at.desc";

        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        try {
            return objectMapper.readValue(response.getBody(), new TypeReference<List<Product>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse products", e);
        }
    }

    public PageResponseDTO<AdminProductDTO> getAdminProducts(int page, int limit) {
        int start = (page - 1) * limit;
        int end = start + limit - 1;

        // Query JOIN bảng products và profiles thông qua seller_id
        // Đã xóa chữ ':seller_id', chỉ giữ lại tên bảng 'profiles'
        String url = supabaseUrl + "/rest/v1/products?select=*,profiles(full_name,avatar_url)&order=created_at.desc";
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");
        // Header yêu cầu Supabase trả về tổng số bản ghi (exact count)
        headers.set("Prefer", "count=exact");
        // Header phân trang
        headers.set("Range-Unit", "items");
        headers.set("Range", start + "-" + end);

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        try {
            // Lấy tổng số bản ghi từ header "Content-Range" của Supabase (VD: "0-9/125" ->
            // lấy 125)
            long totalElements = 0;
            List<String> contentRangeHeader = response.getHeaders().get("Content-Range");
            if (contentRangeHeader != null && !contentRangeHeader.isEmpty()) {
                String range = contentRangeHeader.get(0);
                String[] parts = range.split("/");
                if (parts.length > 1) {
                    totalElements = Long.parseLong(parts[1]);
                }
            }

            int totalPages = (int) Math.ceil((double) totalElements / limit);

            // Parse chuỗi JSON body trả về
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            List<AdminProductDTO> productList = new ArrayList<>();

            if (rootNode.isArray()) {
                for (JsonNode node : rootNode) {
                    AdminProductDTO dto = new AdminProductDTO();

                    // Map các field của product
                    dto.setId(node.hasNonNull("id") ? node.get("id").asText() : null);
                    dto.setName(node.hasNonNull("name") ? node.get("name").asText() : null);
                    dto.setPrice(
                            node.hasNonNull("price") ? new BigDecimal(node.get("price").asText()) : BigDecimal.ZERO);
                    dto.setImageUrl(node.hasNonNull("image_url") ? node.get("image_url").asText() : null);
                    dto.setStatus(node.hasNonNull("status") ? node.get("status").asText() : null);
                    // dto.setCreatedAt(node.hasNonNull("created_at") ?
                    // node.get("created_at").asText() : null);
                    // dto.setCreatedAt(node.get("created_at").asText());
                    dto.setSellerId(node.hasNonNull("seller_id") ? node.get("seller_id").asText() : null);

                    // Map object "profiles" đã được Supabase JOIN
                    JsonNode profileNode = node.get("profiles");
                    if (profileNode != null && !profileNode.isNull() && profileNode.isObject()) {
                        dto.setSellerName(profileNode.hasNonNull("full_name") ? profileNode.get("full_name").asText()
                                : "Người dùng ẩn danh");
                        dto.setSellerAvatar(
                                profileNode.hasNonNull("avatar_url") ? profileNode.get("avatar_url").asText() : null);
                    } else {
                        dto.setSellerName("Người dùng ẩn danh");
                    }

                    productList.add(dto);
                }
            }

            return new PageResponseDTO<>(productList, page, totalPages, totalElements);

        } catch (Exception e) {
            System.err.println("Error parsing admin products: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch admin products: " + e.getMessage(), e);
        }
    }

    // 1. Hàm lấy danh sách người dùng cho Admin
    public PageResponseDTO<AdminUserDTO> getAdminUsers(int page, int limit) {
        int start = (page - 1) * limit;
        int end = start + limit - 1;

        // Lấy thông tin từ bảng profiles, sắp xếp mới nhất lên đầu
        String url = supabaseUrl + "/rest/v1/profiles?select=*&order=created_at.desc";

        HttpHeaders headers = createHeaders(); // Sử dụng hàm createHeaders() bạn đã có
        headers.set("Accept", "application/json");
        headers.set("Prefer", "count=exact");
        headers.set("Range-Unit", "items");
        headers.set("Range", start + "-" + end);

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        try {
            long totalElements = 0;
            List<String> contentRangeHeader = response.getHeaders().get("Content-Range");
            if (contentRangeHeader != null && !contentRangeHeader.isEmpty()) {
                String range = contentRangeHeader.get(0);
                String[] parts = range.split("/");
                if (parts.length > 1) {
                    totalElements = Long.parseLong(parts[1]);
                }
            }

            int totalPages = (int) Math.ceil((double) totalElements / limit);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            List<AdminUserDTO> userList = new ArrayList<>();

            if (rootNode.isArray()) {
                for (JsonNode node : rootNode) {
                    AdminUserDTO dto = new AdminUserDTO();
                    dto.setId(node.hasNonNull("id") ? node.get("id").asText() : null);
                    dto.setFullName(node.hasNonNull("full_name") ? node.get("full_name").asText() : "Chưa cập nhật");
                    dto.setRole(node.hasNonNull("role") ? node.get("role").asText() : "user");
                    dto.setAvatarUrl(node.hasNonNull("avatar_url") ? node.get("avatar_url").asText() : null);
                    dto.setPhone(node.hasNonNull("phone") ? node.get("phone").asText() : "Chưa cập nhật");

                    // Mặc định nếu null thì hiểu là 0 (Chưa xóa/Đang hoạt động)
                    dto.setIsDelete(node.hasNonNull("isDelete") ? node.get("isDelete").asText() : "0");
                    dto.setCreatedAt(node.hasNonNull("created_at") ? node.get("created_at").asText() : null);

                    userList.add(dto);
                }
            }

            return new PageResponseDTO<>(userList, page, totalPages, totalElements);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch admin users: " + e.getMessage(), e);
        }
    }

    // Lấy danh sách tất cả hội thoại kèm thông tin User từ bảng profiles
    public List<AdminConversationDTO> getAllConversations() {
        // URL join profiles thông qua user1_id và user2_id
        String url = supabaseUrl
                + "/rest/v1/conversations?select=*,user1:profiles!user1_id(full_name,avatar_url),user2:profiles!user2_id(full_name,avatar_url)&order=updated_at.desc";

        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            JsonNode rootNode = objectMapper.readTree(response.getBody());
            List<AdminConversationDTO> dtoList = new ArrayList<>();

            if (rootNode.isArray()) {
                for (JsonNode node : rootNode) {
                    JsonNode u1 = node.get("user1");
                    JsonNode u2 = node.get("user2");

                    AdminConversationDTO dto = new AdminConversationDTO(
                            node.path("id").asText(),
                            node.path("user1_id").asText(),
                            u1 != null ? u1.path("full_name").asText() : "N/A",
                            u1 != null ? u1.path("avatar_url").asText() : null,
                            node.path("user2_id").asText(),
                            u2 != null ? u2.path("full_name").asText() : "N/A",
                            u2 != null ? u2.path("avatar_url").asText() : null,
                            node.path("last_message").asText(""),
                            node.has("updated_at")
                                    ? LocalDateTime.parse(node.get("updated_at").asText(),
                                            DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                                    : LocalDateTime.now());
                    dtoList.add(dto);
                }
            }
            return dtoList;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error fetching conversations: " + e.getMessage());
        }
    }

    // Lấy chi tiết tin nhắn của một hội thoại
    public List<AdminMessageDTO> getMessages2(String conversationId) {
    String url = supabaseUrl + "/rest/v1/messages?conversation_id=eq." + conversationId + "&order=created_at.asc";
    
    HttpHeaders headers = createHeaders();
    headers.set("Accept", "application/json");

    try {
        ResponseEntity<String> response = restTemplate.exchange(
            url, HttpMethod.GET, new HttpEntity<>(headers), String.class
        );

        JsonNode rootNode = objectMapper.readTree(response.getBody());
        List<AdminMessageDTO> dtoList = new ArrayList<>();

        if (rootNode.isArray()) {
            for (JsonNode node : rootNode) {
                AdminMessageDTO dto = new AdminMessageDTO(
                    node.path("id").asText(),
                    node.path("sender_id").asText(),
                    node.path("content").asText(),
                    LocalDateTime.parse(node.get("created_at").asText(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                );
                dtoList.add(dto);
            }
        }
        return dtoList;
    } catch (Exception e) {
        throw new RuntimeException("Error fetching messages: " + e.getMessage());
    }
}

    public void toggleUserLock(String userId, String newStatus) {
        // newStatus sẽ là "1" (Khóa) hoặc "0" (Mở khóa)
        String url = supabaseUrl + "/rest/v1/profiles?id=eq." + userId;

        HttpHeaders headers = createHeaders();
        headers.set("Content-Type", "application/json");
        // Quan trọng: Phải có header này để Supabase cho phép cập nhật
        headers.set("Prefer", "return=representation");

        // Tạo JSON body
        Map<String, String> body = new HashMap<>();
        body.put("isDelete", newStatus);

        try {
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            System.out.println(
                    ">>> [Backend] Đã cập nhật trạng thái isDelete = " + newStatus + " cho User ID: " + userId);
        } catch (Exception e) {
            throw new RuntimeException("Không thể cập nhật trạng thái khóa: " + e.getMessage());
        }
    }

    public Product getProduct(String productId) {
        String url = supabaseUrl + "/rest/v1/products?id=eq." + productId;

        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        try {
            List<Product> products = objectMapper.readValue(response.getBody(), new TypeReference<List<Product>>() {
            });
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
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            List<Product> products = objectMapper.readValue(response.getBody(), new TypeReference<List<Product>>() {
            });
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
                    url, HttpMethod.PATCH, new HttpEntity<>(body, headers), String.class);

            List<Product> products = objectMapper.readValue(response.getBody(), new TypeReference<List<Product>>() {
            });
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
                file.getContentType() != null ? file.getContentType() : "application/octet-stream"));

        try {
            byte[] fileBytes = file.getBytes();
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(fileBytes, headers), String.class);

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
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        try {
            List<Map<String, Object>> profiles = objectMapper.readValue(
                    response.getBody(), new TypeReference<List<Map<String, Object>>>() {
                    });
            return profiles.isEmpty() ? null : profiles.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get profile", e);
        }
    }

    // ==================== CHAT ====================

    public List<Conversation> getConversations(String userId) {
        try {
            String url = supabaseUrl + "/rest/v1/conversations?or=(user1_id.eq." + userId + ",user2_id.eq." + userId
                    + ")&order=updated_at.desc";

            HttpHeaders headers = createHeaders();
            headers.set("Accept", "application/json");

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Supabase API returned status: " + response.getStatusCode());
            }

            return objectMapper.readValue(response.getBody(), new TypeReference<List<Conversation>>() {
            });
        } catch (Exception e) {
            System.err.println("Error in getConversations: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get conversations: " + e.getMessage(), e);
        }
    }

    public Conversation getOrCreateConversation(String user1Id, String user2Id) {
        try {
            // Tìm hội thoại hiện có
            String url = supabaseUrl + "/rest/v1/conversations?or=(and(user1_id.eq." + user1Id + ",user2_id.eq."
                    + user2Id + "),and(user1_id.eq." + user2Id + ",user2_id.eq." + user1Id + "))";

            HttpHeaders headers = createHeaders();
            headers.set("Accept", "application/json");

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            List<Conversation> list = objectMapper.readValue(response.getBody(),
                    new TypeReference<List<Conversation>>() {
                    });
            if (!list.isEmpty())
                return list.get(0);

            // Nếu không có, tạo mới
            String postUrl = supabaseUrl + "/rest/v1/conversations";
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Prefer", "return=representation");

            Map<String, String> body = new HashMap<>();
            body.put("user1_id", user1Id);
            body.put("user2_id", user2Id);

            String bodyJson = objectMapper.writeValueAsString(body);
            System.out.println("Creating conversation with body: " + bodyJson);

            ResponseEntity<String> postRes = restTemplate.exchange(
                    postUrl, HttpMethod.POST, new HttpEntity<>(bodyJson, headers), String.class);

            if (!postRes.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException(
                        "Supabase API returned status: " + postRes.getStatusCode() + " - " + postRes.getBody());
            }

            List<Conversation> created = objectMapper.readValue(postRes.getBody(),
                    new TypeReference<List<Conversation>>() {
                    });
            if (created.isEmpty()) {
                throw new RuntimeException("Conversation creation returned empty list");
            }
            return created.get(0);
        } catch (Exception e) {
            System.err.println("Error in getOrCreateConversation: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get or create conversation: " + e.getMessage(), e);
        }
    }

    public List<Message> getMessages(String conversationId) {
        try {
            String url = supabaseUrl + "/rest/v1/messages?conversation_id=eq." + conversationId
                    + "&order=created_at.asc";

            HttpHeaders headers = createHeaders();
            headers.set("Accept", "application/json");

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Supabase API returned status: " + response.getStatusCode());
            }

            return objectMapper.readValue(response.getBody(), new TypeReference<List<Message>>() {
            });
        } catch (Exception e) {
            System.err.println("Error in getMessages: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get messages: " + e.getMessage(), e);
        }
    }

    public Message createMessage(Map<String, Object> messageData) {
        try {
            String url = supabaseUrl + "/rest/v1/messages";

            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Prefer", "return=representation");

            String bodyJson = objectMapper.writeValueAsString(messageData);
            System.out.println("Creating message with data: " + bodyJson);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(bodyJson, headers), String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException(
                        "Supabase API returned status: " + response.getStatusCode() + " - " + response.getBody());
            }

            // Cập nhật updated_at cho conversation
            Object convIdObj = messageData.get("conversation_id");
            if (convIdObj != null) {
                String convId = convIdObj.toString();
                updateConversationTime(convId);
            }

            List<Message> messages = objectMapper.readValue(response.getBody(), new TypeReference<List<Message>>() {
            });
            if (messages.isEmpty()) {
                throw new RuntimeException("Message creation returned empty list");
            }
            return messages.get(0);
        } catch (Exception e) {
            System.err.println("Error in createMessage: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create message: " + e.getMessage(), e);
        }
    }

    public void markMessagesAsRead(String conversationId, String userId) {
        String url = supabaseUrl + "/rest/v1/messages?conversation_id=eq." + conversationId + "&sender_id=neq." + userId
                + "&read_at=is.null";
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=minimal");

        Map<String, String> body = new HashMap<>();
        body.put("read_at", java.time.OffsetDateTime.now().toString());

        try {
            String bodyJson = objectMapper.writeValueAsString(body);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.PATCH, new HttpEntity<>(bodyJson, headers), String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to mark messages as read: " + response.getBody());
            }
        } catch (Exception e) {
            System.err.println("Error in markMessagesAsRead: " + e.getMessage());
            throw new RuntimeException("Failed to mark messages as read: " + e.getMessage(), e);
        }
    }

    private void updateConversationTime(String convId) {
        String url = supabaseUrl + "/rest/v1/conversations?id=eq." + convId;
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = new HashMap<>();
        body.put("updated_at", java.time.OffsetDateTime.now().toString());

        try {
            restTemplate.exchange(url, HttpMethod.PATCH,
                    new HttpEntity<>(objectMapper.writeValueAsString(body), headers), String.class);
        } catch (Exception ignored) {
        }
    }

    // ==================== NOTES ====================

    public Note createNote(Map<String, Object> noteData) {
        String url = supabaseUrl + "/rest/v1/notes";

        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=representation");

        try {
            String body = objectMapper.writeValueAsString(noteData);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            List<Note> notes = objectMapper.readValue(response.getBody(), new TypeReference<List<Note>>() {
            });
            return notes.isEmpty() ? null : notes.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create note: " + e.getMessage(), e);
        }
    }

    public List<Note> getPendingNotes(String userId) {
        String url = supabaseUrl + "/rest/v1/notes?user_id=eq." + userId + "&status=eq.pending&order=deadline.asc";

        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        try {
            return objectMapper.readValue(response.getBody(), new TypeReference<List<Note>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch pending notes: " + e.getMessage(), e);
        }
    }

    public Note updateNote(String noteId, Map<String, Object> noteData) {
        String url = supabaseUrl + "/rest/v1/notes?id=eq." + noteId;

        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=representation");

        try {
            String body = objectMapper.writeValueAsString(noteData);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.PATCH, new HttpEntity<>(body, headers), String.class);

            List<Note> notes = objectMapper.readValue(response.getBody(), new TypeReference<List<Note>>() {
            });
            return notes.isEmpty() ? null : notes.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update note: " + e.getMessage(), e);
        }
    }
    // ==================== REVIEWS ====================

    // 1. Lấy danh sách đánh giá của 1 sản phẩm
    public List<Review> getReviewsByProduct(String productId) {
        String url = supabaseUrl + "/rest/v1/reviews?product_id=eq." + productId + "&order=created_at.desc";
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        try {
            return objectMapper.readValue(response.getBody(), new TypeReference<List<Review>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse reviews", e);
        }
    }

    // 2. Kiểm tra xem user đã đánh giá sản phẩm này chưa (Chống spam)
    public boolean hasUserReviewedProduct(String productId, String reviewerId) {
        String url = supabaseUrl + "/rest/v1/reviews?product_id=eq." + productId + "&reviewer_id=eq." + reviewerId;
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        try {
            List<Review> reviews = objectMapper.readValue(response.getBody(), new TypeReference<List<Review>>() {
            });
            return !reviews.isEmpty(); // Trả về true nếu list không rỗng (đã đánh giá)
        } catch (Exception e) {
            throw new RuntimeException("Failed to check existing review", e);
        }
    }

    // 3. Tạo đánh giá mới
    public Review createReview(Map<String, Object> reviewData) {
        String url = supabaseUrl + "/rest/v1/reviews";
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=representation");

        try {
            String body = objectMapper.writeValueAsString(reviewData);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            List<Review> reviews = objectMapper.readValue(response.getBody(), new TypeReference<List<Review>>() {
            });
            return reviews.isEmpty() ? null : reviews.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create review: " + e.getMessage(), e);
        }
    }

    // Lấy 1 đánh giá (Dùng để check xem ai là chủ của đánh giá này)
    public Review getReviewById(String reviewId) {
        String url = supabaseUrl + "/rest/v1/reviews?id=eq." + reviewId;
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers),
                String.class);
        try {
            List<Review> reviews = objectMapper.readValue(response.getBody(), new TypeReference<List<Review>>() {
            });
            return reviews.isEmpty() ? null : reviews.get(0);
        } catch (Exception e) {
            return null;
        }
    }

    // Cập nhật đánh giá
    public Review updateReview(String reviewId, Map<String, Object> reviewData) {
        String url = supabaseUrl + "/rest/v1/reviews?id=eq." + reviewId;
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=representation");
        try {
            String body = objectMapper.writeValueAsString(reviewData);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.PATCH, new HttpEntity<>(body, headers), String.class);
            List<Review> reviews = objectMapper.readValue(response.getBody(), new TypeReference<List<Review>>() {
            });
            return reviews.isEmpty() ? null : reviews.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi update review", e);
        }
    }

    // Xóa đánh giá
    public void deleteReview(String reviewId) {
        String url = supabaseUrl + "/rest/v1/reviews?id=eq." + reviewId;
        HttpHeaders headers = createHeaders();
        restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), String.class);
    }
    // ==================== PRICE OFFERS ====================

    public PriceOffer createPriceOffer(Map<String, Object> offerData) {
        String url = supabaseUrl + "/rest/v1/price_offers";
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Prefer", "return=representation");

        // Set defaults
        offerData.put("status", "pending");
        offerData.put("initiated_by", offerData.get("buyer_id"));

        try {
            String body = objectMapper.writeValueAsString(offerData);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
            List<PriceOffer> offers = objectMapper.readValue(response.getBody(), new TypeReference<List<PriceOffer>>() {
            });
            return offers.isEmpty() ? null : offers.get(0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create price offer: " + e.getMessage(), e);
        }
    }

    public List<PriceOffer> getOffersByConversation(String conversationId) {
        String url = supabaseUrl + "/rest/v1/price_offers?conversation_id=eq." + conversationId
                + "&order=created_at.desc";
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
        try {
            return objectMapper.readValue(response.getBody(), new TypeReference<List<PriceOffer>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to get price offers: " + e.getMessage(), e);
        }
    }

    public PriceOffer confirmPriceOffer(String offerId, String userId) {
        // Lấy offer hiện tại để biết trạng thái và ai là buyer/seller
        String getUrl = supabaseUrl + "/rest/v1/price_offers?id=eq." + offerId;
        HttpHeaders headers = createHeaders();
        headers.set("Accept", "application/json");

        try {
            ResponseEntity<String> getRes = restTemplate.exchange(
                    getUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            List<PriceOffer> offers = objectMapper.readValue(getRes.getBody(), new TypeReference<List<PriceOffer>>() {
            });
            if (offers.isEmpty())
                throw new RuntimeException("Offer not found");

            PriceOffer offer = offers.get(0);
            String buyerId = offer.getBuyerId();
            String sellerId = offer.getSellerId();
            String currentStatus = offer.getStatus();

            // Xác định status mới dựa trên người bấm
            String newStatus;
            boolean shouldUpdatePrice = false;

            boolean isBuyer = userId.equals(buyerId);
            boolean isSeller = userId.equals(sellerId);

            if ("pending".equals(currentStatus)) {
                // Offer vừa tạo (buyer tạo), bên nào confirm trước
                if (isBuyer) {
                    newStatus = "buyer_confirmed";
                } else if (isSeller) {
                    newStatus = "seller_confirmed";
                } else {
                    throw new RuntimeException("User is not part of this offer");
                }
            } else if ("buyer_confirmed".equals(currentStatus) && isSeller) {
                // Buyer đã confirm, seller confirm → accepted
                newStatus = "accepted";
                shouldUpdatePrice = true;
            } else if ("seller_confirmed".equals(currentStatus) && isBuyer) {
                // Seller đã confirm, buyer confirm → accepted
                newStatus = "accepted";
                shouldUpdatePrice = true;
            } else {
                throw new RuntimeException("Không thể xác nhận ở trạng thái này: " + currentStatus);
            }

            // Cập nhật status offer
            String patchUrl = supabaseUrl + "/rest/v1/price_offers?id=eq." + offerId;
            HttpHeaders patchHeaders = createHeaders();
            patchHeaders.setContentType(MediaType.APPLICATION_JSON);
            patchHeaders.set("Prefer", "return=representation");

            Map<String, Object> patchBody = new HashMap<>();
            patchBody.put("status", newStatus);
            patchBody.put("updated_at", java.time.OffsetDateTime.now().toString());

            String patchJson = objectMapper.writeValueAsString(patchBody);
            ResponseEntity<String> patchRes = restTemplate.exchange(
                    patchUrl, HttpMethod.PATCH, new HttpEntity<>(patchJson, patchHeaders), String.class);

            List<PriceOffer> updated = objectMapper.readValue(patchRes.getBody(),
                    new TypeReference<List<PriceOffer>>() {
                    });
            PriceOffer updatedOffer = updated.isEmpty() ? offer : updated.get(0);

            // Nếu cả 2 đã xác nhận → update giá sản phẩm
            if (shouldUpdatePrice && offer.getProductId() != null && offer.getOfferPrice() != null) {
                updateProductPrice(offer.getProductId(), offer.getOfferPrice());
            }

            return updatedOffer;
        } catch (Exception e) {
            throw new RuntimeException("Failed to confirm offer: " + e.getMessage(), e);
        }
    }

    public void rejectPriceOffer(String offerId) {
        String url = supabaseUrl + "/rest/v1/price_offers?id=eq." + offerId;
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("status", "rejected");
            body.put("updated_at", java.time.OffsetDateTime.now().toString());

            restTemplate.exchange(url, HttpMethod.PATCH,
                    new HttpEntity<>(objectMapper.writeValueAsString(body), headers), String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to reject offer: " + e.getMessage(), e);
        }
    }

    private void updateProductPrice(String productId, java.math.BigDecimal newPrice) {
        String url = supabaseUrl + "/rest/v1/products?id=eq." + productId;
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("price", newPrice);
            body.put("updated_at", java.time.OffsetDateTime.now().toString());

            restTemplate.exchange(url, HttpMethod.PATCH,
                    new HttpEntity<>(objectMapper.writeValueAsString(body), headers), String.class);
        } catch (Exception e) {
            System.err.println("Failed to update product price: " + e.getMessage());
        }
    }

    // ==================== HELPERS ====================

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        return headers;
    }
}
