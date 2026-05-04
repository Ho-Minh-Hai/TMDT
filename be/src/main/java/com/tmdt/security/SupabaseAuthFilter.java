package com.tmdt.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmdt.service.SupabaseService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;

@Component
public class SupabaseAuthFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private SupabaseService supabaseService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String[] parts = token.split("\\.");
                if (parts.length == 3) {
                    String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
                    @SuppressWarnings("unchecked")
                    Map<String, Object> claims = objectMapper.readValue(payload, Map.class);
                    String userId = (String) claims.get("sub");

                    if (userId != null) {
                        String userRole = "USER"; 
                        System.out.println(">>> [Auth Filter] Đang kiểm tra token của User ID: " + userId);

                        try {
                            Map<String, Object> profile = supabaseService.getProfile(userId);
                            if (profile != null && profile.get("role") != null) {
                                String dbRole = String.valueOf(profile.get("role"));
                                System.out.println(">>> [Auth Filter] Role lấy được từ Database: " + dbRole);
                                
                                // Dùng equalsIgnoreCase để không bị lỗi nếu DB lưu "Admin", "ADMIN" hay "admin"
                                if (dbRole.trim().equalsIgnoreCase("admin")) {
                                    userRole = "ADMIN";
                                }
                            } else {
                                System.out.println(">>> [Auth Filter] Không tìm thấy profile hoặc cột role bị null.");
                            }
                        } catch (Exception e) {
                            System.out.println(">>> [Auth Filter] Lỗi khi gọi getProfile: " + e.getMessage());
                        }

                        System.out.println(">>> [Auth Filter] Quyền cuối cùng được cấp: ROLE_" + userRole);

                        UserPrincipal principal = new UserPrincipal(userId, token, userRole);
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + userRole);

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                        principal, null, Collections.singletonList(authority)
                                );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (Exception e) {
                System.err.println("JWT decode error: " + e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}