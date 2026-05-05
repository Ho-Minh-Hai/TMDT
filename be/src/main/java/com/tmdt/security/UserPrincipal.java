package com.tmdt.security;

/**
 * Holds user information extracted from Supabase JWT.
 */
public class UserPrincipal {
    private final String userId;
    private final String accessToken;
    private final String role;

    public UserPrincipal(String userId, String accessToken, String role) {
        this.userId = userId;
        this.accessToken = accessToken;
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRole() {
        return role;
    }

    @Override
    public String toString() {
        return "UserPrincipal{userId='" + userId + "', role='" + role + "'}";
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> 8bdb7abe26673c0996177e7f5b87f44ce48833d3
