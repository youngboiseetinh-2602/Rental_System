package com.javaweb.config;

import com.javaweb.entity.UserEntity;
import com.javaweb.security.AccessTokenUserValidator;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.crypto.password.PasswordEncoder;

// Dang ky OAuth2 client va bo sung cac claim rieng vao access token JWT.
@Configuration
public class AuthorizationServerConfig {

    @Bean
    public RegisteredClientRepository registeredClientRepository(
            @Value("${oauth2.client.internal-id}") String internalId,
            @Value("${oauth2.client.id}") String clientId,
            @Value("${oauth2.client.redirect-uri}") String redirectUri,
            @Value("${oauth2.client.secret}") String clientSecret,
            PasswordEncoder passwordEncoder
    ) {
        RegisteredClient rentalClient = RegisteredClient.withId(internalId)
                .clientId(clientId)
                .clientSecret(passwordEncoder.encode(clientSecret))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri(redirectUri)
                .scope("room.read")
                .scope("room.write")
                .clientSettings(ClientSettings.builder()
                        .requireProofKey(true)
                        .requireAuthorizationConsent(true)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(30))
                        .refreshTokenTimeToLive(Duration.ofDays(7))
                        .reuseRefreshTokens(false)
                        .build())
                .build();

        return new InMemoryRegisteredClientRepository(rentalClient);
    }

    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> jwtTokenCustomizer(
            AccessTokenUserValidator accessTokenUserValidator,
            @Value("${authorization-server.audience}") String audience
    ) {
        return context -> {
            if (!OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
                return;
            }

            UserEntity user = accessTokenUserValidator.validateAndGetUser(
                    context.getPrincipal().getName()
            );

            // Lay role moi nhat tu database, khong dung role cu dang luu trong session.
            List<String> roles = List.of(user.getRole().name());

            context.getClaims().claim("userId", user.getId());
            context.getClaims().claim("roles", roles);
            context.getClaims().audience(List.of(audience));
        };
    }
}
