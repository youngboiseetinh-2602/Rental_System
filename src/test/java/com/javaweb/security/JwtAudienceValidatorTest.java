package com.javaweb.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

class JwtAudienceValidatorTest {

    private final JwtAudienceValidator validator = new JwtAudienceValidator("rental-api");

    @Test
    void acceptsJwtWithRequiredAudience() {
        OAuth2TokenValidatorResult result = validator.validate(jwtWithAudience("rental-api"));

        assertFalse(result.hasErrors());
    }

    @Test
    void rejectsJwtWithoutRequiredAudience() {
        OAuth2TokenValidatorResult result = validator.validate(jwtWithAudience("another-api"));

        assertTrue(result.hasErrors());
    }

    @Test
    void rejectsJwtWithoutAudienceClaim() {
        Instant issuedAt = Instant.now();
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .issuer("http://localhost:8080")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(1800))
                .build();

        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertTrue(result.hasErrors());
    }

    private Jwt jwtWithAudience(String audience) {
        Instant issuedAt = Instant.now();
        return Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .issuer("http://localhost:8080")
                .audience(List.of(audience))
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(1800))
                .build();
    }
}
