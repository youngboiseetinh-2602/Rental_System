package com.javaweb.security;

import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserStatus;
import com.javaweb.repository.UserRepository;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.stereotype.Component;

/**
 * Bổ sung thông tin người dùng và vai trò vào các claim của access token JWT.
 */
@Component
public class JwtTokenCustomizer implements OAuth2TokenCustomizer<JwtEncodingContext> {

    private final UserRepository userRepository;

    public JwtTokenCustomizer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void customize(JwtEncodingContext context) {
        if (!OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
            return;
        }

        UserEntity user = loadActiveUser(context);
        context.getClaims()
                .claim("roles", List.of(user.getRole().name()))
                .claim("username", user.getUsername())
                .claim("userId", user.getId())
                .subject(user.getId().toString());
    }

    private UserEntity loadActiveUser(JwtEncodingContext context) {
        UserEntity user = userRepository.findByUsername(resolveUsername(context))
                .orElseThrow(this::invalidGrant);

        if (user.getStatus() != UserStatus.ACTIVE || user.getRole() == null) {
            throw invalidGrant();
        }
        return user;
    }

    private String resolveUsername(JwtEncodingContext context) {
        OAuth2Authorization authorization = context.getAuthorization();
        if (authorization != null) {
            return authorization.getPrincipalName();
        }

        Authentication principal = context.getPrincipal();
        if (principal != null) {
            return principal.getName();
        }

        throw invalidGrant();
    }

    private OAuth2AuthenticationException invalidGrant() {
        OAuth2Error error = new OAuth2Error(
                OAuth2ErrorCodes.INVALID_GRANT,
                "User account is not eligible to receive a token",
                null
        );
        return new OAuth2AuthenticationException(error);
    }
}
