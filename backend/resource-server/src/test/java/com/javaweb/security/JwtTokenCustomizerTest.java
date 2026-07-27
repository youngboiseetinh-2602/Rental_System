package com.javaweb.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import com.javaweb.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;

class JwtTokenCustomizerTest {

    private final UserRepository userRepository =
            org.mockito.Mockito.mock(UserRepository.class);
    private final JwtTokenCustomizer customizer =
            new JwtTokenCustomizer(userRepository);

    @Test
    void accessTokenGetsIdentityClaims() {
        UserEntity user = user("customer", UserStatus.ACTIVE);
        when(userRepository.findByUsername("customer")).thenReturn(Optional.of(user));
        JwtEncodingContext context = context(
                OAuth2TokenType.ACCESS_TOKEN,
                "customer",
                JwtClaimsSet.builder().subject("customer")
        );

        customizer.customize(context);
        JwtClaimsSet claims = context.getClaims().build();

        assertEquals("42", claims.getSubject());
        assertEquals(List.of("CUSTOMER"), claims.getClaim("roles"));
        assertEquals("customer", claims.getClaim("username"));
        assertEquals(Long.valueOf(42L), claims.<Long>getClaim("userId"));
    }

    @Test
    void idTokenKeepsOidcClientAudience() {
        UserEntity user = user("customer", UserStatus.ACTIVE);
        when(userRepository.findByUsername("customer")).thenReturn(Optional.of(user));
        JwtEncodingContext context = context(
                new OAuth2TokenType(OidcParameterNames.ID_TOKEN),
                "customer",
                JwtClaimsSet.builder()
                        .subject("customer")
                        .audience(List.of("rental-spa"))
        );

        customizer.customize(context);
        JwtClaimsSet claims = context.getClaims().build();

        assertEquals("customer", claims.getSubject());
        assertEquals(List.of("rental-spa"), claims.getAudience());
        assertEquals(List.of("CUSTOMER"), claims.getClaim("roles"));
        assertEquals("customer", claims.getClaim("username"));
        assertEquals(Long.valueOf(42L), claims.<Long>getClaim("userId"));
    }

    @Test
    void inactiveUserCannotReceiveToken() {
        UserEntity user = user("customer", UserStatus.LOCKED);
        when(userRepository.findByUsername("customer")).thenReturn(Optional.of(user));
        JwtEncodingContext context = context(
                OAuth2TokenType.ACCESS_TOKEN,
                "customer",
                JwtClaimsSet.builder().subject("customer")
        );

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> customizer.customize(context)
        );

        assertEquals(OAuth2ErrorCodes.INVALID_GRANT, exception.getError().getErrorCode());
    }

    private JwtEncodingContext context(
            OAuth2TokenType tokenType,
            String username,
            JwtClaimsSet.Builder claims
    ) {
        UsernamePasswordAuthenticationToken principal =
                UsernamePasswordAuthenticationToken.authenticated(
                        username,
                        "n/a",
                        List.of()
                );
        return JwtEncodingContext.with(
                        JwsHeader.with(SignatureAlgorithm.RS256),
                        claims
                )
                .principal(principal)
                .tokenType(tokenType)
                .build();
    }

    private UserEntity user(String username, UserStatus status) {
        UserEntity user = new UserEntity();
        user.setId(42L);
        user.setUsername(username);
        user.setPassword("encoded");
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(status);
        return user;
    }
}
