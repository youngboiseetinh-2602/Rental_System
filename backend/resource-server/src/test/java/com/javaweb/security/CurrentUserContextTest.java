package com.javaweb.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class CurrentUserContextTest {

    private final CurrentUserContext currentUserContext = new CurrentUserContext();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsUserIdFromJwtAuthenticationToken() {
        Jwt jwt = jwtWithUserId(42L);
        JwtAuthenticationToken authentication = authenticatedToken(jwt);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        assertEquals(42L, currentUserContext.getCurrentUserId());
    }

    @Test
    void returnsStringUserIdFromJwtAuthenticationToken() {
        Jwt jwt = jwtWithUserId("42");
        JwtAuthenticationToken authentication = authenticatedToken(jwt);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        assertEquals(42L, currentUserContext.getCurrentUserId());
    }

    @Test
    void rejectsJwtWithoutUserId() {
        Jwt jwt = Jwt.withTokenValue("access-token")
                .header("alg", "RS256")
                .subject("customer02")
                .build();
        JwtAuthenticationToken authentication = authenticatedToken(jwt);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        assertThrows(
                AuthenticationCredentialsNotFoundException.class,
                currentUserContext::getCurrentUserId
        );
    }

    @Test
    void readsAuthoritiesFromJwtAuthenticationToken() {
        JwtAuthenticationToken authentication = new JwtAuthenticationToken(
                jwtWithUserId(42L),
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        assertTrue(currentUserContext.hasAuthority("ROLE_CUSTOMER"));
        assertFalse(currentUserContext.hasAuthority("ROLE_ADMIN"));
    }

    private Jwt jwtWithUserId(Object userId) {
        return Jwt.withTokenValue("access-token")
                .header("alg", "RS256")
                .subject("customer02")
                .claim("userId", userId)
                .build();
    }

    private JwtAuthenticationToken authenticatedToken(Jwt jwt) {
        return new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
    }
}
