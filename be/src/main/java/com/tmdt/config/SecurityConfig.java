package com.tmdt.config;

import com.tmdt.security.SupabaseAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final SupabaseAuthFilter supabaseAuthFilter;

    public SecurityConfig(SupabaseAuthFilter supabaseAuthFilter) {
        this.supabaseAuthFilter = supabaseAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(new CorsConfig().corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public routes
                .requestMatchers("/api/health", "/api/chat/**", "/api/notes/**", "/auth/**").permitAll()
                
                // ADMIN ONLY Routes (Yêu cầu ROLE_ADMIN)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/products/admin").hasRole("ADMIN")
                // Authenticated routes cho User thường
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/chat/**").permitAll()
                .requestMatchers("/api/notes/**").permitAll()
                .requestMatchers("/api/offers/**").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/product/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(supabaseAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
