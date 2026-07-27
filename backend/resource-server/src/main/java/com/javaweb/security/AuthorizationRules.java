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

    public static final String ROOM_READ = "hasAuthority('SCOPE_room.read')";
    public static final String ROOM_WRITE = "hasAuthority('SCOPE_room.write')";
    public static final String USER_READ_SCOPE = "hasAuthority('SCOPE_user.read')";
    public static final String USER_WRITE_SCOPE = "hasAuthority('SCOPE_user.write')";
    public static final String BOOKING_READ = "hasAuthority('SCOPE_booking.read')";
    public static final String BOOKING_WRITE = "hasAuthority('SCOPE_booking.write')";

    public static final String ROOM_READ_OWNER =
            ROOM_READ + " and " + OWNER;
    public static final String ROOM_WRITE_OWNER =
            ROOM_WRITE + " and " + OWNER;
    public static final String ROOM_WRITE_OWNER_OR_ADMIN =
            ROOM_WRITE + " and " + OWNER_OR_ADMIN;
    public static final String ROOM_READ_CUSTOMER =
            ROOM_READ + " and " + CUSTOMER;
    public static final String ROOM_WRITE_CUSTOMER =
            ROOM_WRITE + " and " + CUSTOMER;
    public static final String USER_READ =
            USER_READ_SCOPE + " and " + USER;
    public static final String USER_WRITE =
            USER_WRITE_SCOPE + " and " + USER;
    public static final String BOOKING_READ_CUSTOMER =
            BOOKING_READ + " and " + CUSTOMER;
    public static final String BOOKING_WRITE_CUSTOMER =
            BOOKING_WRITE + " and " + CUSTOMER;
    public static final String BOOKING_READ_OWNER =
            BOOKING_READ + " and " + OWNER;
    public static final String BOOKING_READ_OWNER_OR_ADMIN =
            BOOKING_READ + " and " + OWNER_OR_ADMIN;
    public static final String BOOKING_WRITE_OWNER_OR_ADMIN =
            BOOKING_WRITE + " and " + OWNER_OR_ADMIN;

    // Ngan khoi tao class chi chua hang so.
    private AuthorizationRules() {
    }
}
