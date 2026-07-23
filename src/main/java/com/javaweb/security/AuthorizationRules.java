package com.javaweb.security;

// Tap trung cac bieu thuc role dung chung cho HTTP va @PreAuthorize.
public final class AuthorizationRules {

    public static final String PUBLIC = "permitAll()";

    public static final String ADMIN = "hasRole('ADMIN')";
    public static final String OWNER = "hasRole('OWNER')";
    public static final String OWNER_OR_ADMIN = "hasAnyRole('OWNER', 'ADMIN')";
    public static final String CUSTOMER = "hasRole('CUSTOMER')";
    public static final String CHAT_USER = "hasAnyRole('CUSTOMER', 'OWNER', 'ADMIN')";
    public static final String USER = "hasAnyRole('CUSTOMER', 'OWNER', 'ADMIN')";

    // Ngan khoi tao class chi chua hang so.
    private AuthorizationRules() {
    }
}
