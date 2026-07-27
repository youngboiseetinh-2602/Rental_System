package com.javaweb.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

class WebSecurityConfigTest {

    private final WebSecurityConfig webSecurityConfig = new WebSecurityConfig();

    @Test
    void corsUsesCredentialsOnlyForFrontendSessionAuthentication() {
        CorsConfigurationSource source =
                webSecurityConfig.corsConfigurationSource("http://localhost:3000");

        CorsConfiguration token = configurationFor(source, "/oauth2/token");
        assertNotNull(token);
        assertEquals(List.of("http://localhost:3000"), token.getAllowedOrigins());
        assertEquals(List.of(HttpMethod.POST.name()), token.getAllowedMethods());
        assertEquals(
                List.of(HttpHeaders.ACCEPT, HttpHeaders.CONTENT_TYPE),
                token.getAllowedHeaders()
        );
        assertFalse(Boolean.TRUE.equals(token.getAllowCredentials()));

        CorsConfiguration userInfo = configurationFor(source, "/userinfo");
        assertNotNull(userInfo);
        assertEquals(List.of(HttpMethod.GET.name()), userInfo.getAllowedMethods());
        assertEquals(
                List.of(HttpHeaders.ACCEPT, HttpHeaders.AUTHORIZATION),
                userInfo.getAllowedHeaders()
        );

        assertNotNull(configurationFor(source, "/.well-known/openid-configuration"));
        assertNotNull(configurationFor(source, "/oauth2/jwks"));
        assertNotNull(configurationFor(source, "/api/users/me"));

        CorsConfiguration frontendLogin = configurationFor(source, "/auth/login");
        assertNotNull(frontendLogin);
        assertTrue(Boolean.TRUE.equals(frontendLogin.getAllowCredentials()));
        assertEquals(
                List.of(
                        HttpMethod.POST.name(),
                        HttpMethod.OPTIONS.name()
                ),
                frontendLogin.getAllowedMethods()
        );
        assertEquals(
                List.of(HttpHeaders.ACCEPT, HttpHeaders.CONTENT_TYPE),
                frontendLogin.getAllowedHeaders()
        );

        assertNull(configurationFor(source, "/login"));
    }

    @Test
    void wildcardFrontendOriginIsRejected() {
        assertThrows(
                IllegalArgumentException.class,
                () -> webSecurityConfig.corsConfigurationSource("*")
        );
    }

    private CorsConfiguration configurationFor(
            CorsConfigurationSource source,
            String path
    ) {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", path);
        request.setServletPath(path);
        return source.getCorsConfiguration(request);
    }
}
