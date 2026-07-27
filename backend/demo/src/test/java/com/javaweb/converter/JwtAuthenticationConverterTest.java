package com.javaweb.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

class JwtAuthenticationConverterTest {

    private final JwtAuthenticationConverter converter =
            new JwtAuthenticationConverter();

    @Test
    void mapsScopesAndRolesWithoutDroppingEitherAuthorityType() {
        Jwt jwt = Jwt.withTokenValue("access-token")
                .header("alg", "RS256")
                .subject("42")
                .claim("username", "owner")
                .claim("scope", "room.read room.write")
                .claim("roles", List.of("OWNER"))
                .build();

        AbstractAuthenticationToken authentication =
                converter.convert(jwt);

        Set<String> authorities = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(Collectors.toSet());

        assertEquals("owner", authentication.getName());
        assertTrue(authorities.contains("SCOPE_room.read"));
        assertTrue(authorities.contains("SCOPE_room.write"));
        assertTrue(authorities.contains("ROLE_OWNER"));
    }
}
