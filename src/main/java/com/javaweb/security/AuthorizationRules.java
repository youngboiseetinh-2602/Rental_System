package com.javaweb.security;

// Tap trung cac bieu thuc role/scope dung chung cho HTTP va @PreAuthorize.
public final class AuthorizationRules {

    public static final String PUBLIC = "permitAll()";

    public static final String ADMIN_READ =
            "hasRole('ADMIN') and hasAuthority('SCOPE_room.read')";
    public static final String ADMIN_WRITE =
            "hasRole('ADMIN') and hasAuthority('SCOPE_room.write')";

    public static final String OWNER_READ =
            "hasRole('OWNER') and hasAuthority('SCOPE_room.read')";
    public static final String OWNER_WRITE =
            "hasRole('OWNER') and hasAuthority('SCOPE_room.write')";
    public static final String OWNER_OR_ADMIN_WRITE =
            "hasAnyRole('OWNER', 'ADMIN') and hasAuthority('SCOPE_room.write')";

    public static final String CUSTOMER_READ =
            "hasRole('CUSTOMER') and hasAuthority('SCOPE_room.read')";
    public static final String CUSTOMER_WRITE =
            "hasRole('CUSTOMER') and hasAuthority('SCOPE_room.write')";

    public static final String USER_READ =
            "hasAnyRole('CUSTOMER', 'OWNER', 'ADMIN') "
                    + "and hasAuthority('SCOPE_room.read')";
    public static final String USER_WRITE =
            "hasAnyRole('CUSTOMER', 'OWNER', 'ADMIN') "
                    + "and hasAuthority('SCOPE_room.write')";

    // Ngan khoi tao class chi chua hang so.
    private AuthorizationRules() {
    }
}
