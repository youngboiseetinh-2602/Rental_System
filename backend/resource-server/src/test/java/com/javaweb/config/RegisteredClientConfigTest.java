package com.javaweb.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;

class RegisteredClientConfigTest {

    private final RegisteredClientConfig registeredClientConfig = new RegisteredClientConfig();

    @Test
    void registersPublicSpaWithPkceAndNoRefreshTokenGrant() {
        RegisteredClientRepository repository =
                registeredClientConfig.registeredClientRepository(
                        "rental-spa",
                        "http://localhost:3000/callback",
                        "http://localhost:3000"
                );

        RegisteredClient client = repository.findByClientId("rental-spa");

        assertNotNull(client);
        assertEquals(
                Set.of(ClientAuthenticationMethod.NONE),
                client.getClientAuthenticationMethods()
        );
        assertEquals(
                Set.of(AuthorizationGrantType.AUTHORIZATION_CODE),
                client.getAuthorizationGrantTypes()
        );
        assertFalse(client.getAuthorizationGrantTypes()
                .contains(AuthorizationGrantType.REFRESH_TOKEN));
        assertEquals(
                Set.of("http://localhost:3000/callback"),
                client.getRedirectUris()
        );
        assertEquals(
                Set.of("http://localhost:3000"),
                client.getPostLogoutRedirectUris()
        );
        assertEquals(
                Set.of(
                        OidcScopes.OPENID,
                        OidcScopes.PROFILE,
                        "room.read",
                        "room.write",
                        "user.read",
                        "user.write",
                        "booking.read",
                        "booking.write"
                ),
                client.getScopes()
        );
        assertEquals(
                Duration.ofMinutes(15),
                client.getTokenSettings().getAccessTokenTimeToLive()
        );
        assertTrue(client.getClientSettings().isRequireProofKey());
    }
}
