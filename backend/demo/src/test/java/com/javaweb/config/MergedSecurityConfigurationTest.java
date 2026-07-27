package com.javaweb.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.converter.JwtAuthenticationConverter;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CustomUserDetailsService;
import com.javaweb.security.FrontendAuthenticationFailureHandler;
import com.javaweb.security.FrontendAuthenticationSuccessHandler;
import com.javaweb.security.JwtTokenCustomizer;
import com.javaweb.security.RestAccessDeniedHandler;
import com.javaweb.security.RestAuthenticationEntryPoint;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

@WebMvcTest(controllers = {
        MergedSecurityConfigurationTest.ApiProbeController.class
})
@Import({
        SecurityConfig.class,
        CustomUserDetailsService.class,
        FrontendAuthenticationFailureHandler.class,
        FrontendAuthenticationSuccessHandler.class,
        JwtAuthenticationConverter.class,
        JwtKeyConfig.class,
        JwtTokenCustomizer.class,
        RegisteredClientConfig.class,
        RestAccessDeniedHandler.class,
        RestAuthenticationEntryPoint.class,
        MergedSecurityConfigurationTest.ApiProbeController.class,
        WebSecurityConfig.class
})
class MergedSecurityConfigurationTest {

    private static final String FRONTEND_ORIGIN = "http://localhost:3000";
    private static final String FRONTEND_LOGIN = FRONTEND_ORIGIN + "/login";
    private static final String PKCE_VERIFIER =
            "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    private static final String PKCE_CHALLENGE =
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private List<SecurityFilterChain> securityFilterChains;

    @Autowired
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void createsAuthorizationApiAndFrontendLoginSecurityChains() {
        assertEquals(3, securityFilterChains.size());
    }

    @Test
    void authorizationRequestRedirectsToReactLogin() throws Exception {
        MvcResult result = mockMvc.perform(authorizationRequest())
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl(FRONTEND_LOGIN))
                .andReturn();

        assertNotNull(result.getRequest().getSession(false));
    }

    @Test
    void frontendLoginPreflightAllowsOnlyConfiguredCredentialedOrigin()
            throws Exception {
        mockMvc.perform(options("/auth/login")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD,
                                HttpMethod.POST.name()
                        )
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                                HttpHeaders.CONTENT_TYPE
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        FRONTEND_ORIGIN
                ))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS,
                        "true"
                ))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        HttpHeaders.CONTENT_TYPE
                ));

        mockMvc.perform(options("/auth/login")
                        .header(
                                HttpHeaders.ORIGIN,
                                "http://attacker.example"
                        )
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD,
                                HttpMethod.POST.name()
                        ))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN
                ));
    }

    @Test
    void loginWithoutCsrfReturnsGenericAuthenticationFailure() throws Exception {
        when(userRepository.findByUsername("customer"))
                .thenReturn(Optional.of(activeUser("password")));
        MockHttpSession session = new MockHttpSession();

        mockMvc.perform(loginRequest(session, "customer", "wrong-password"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
    }

    @Test
    void reactLoginRotatesSessionAndApiStillRequiresBearerJwt() throws Exception {
        when(userRepository.findByUsername("customer"))
                .thenReturn(Optional.of(activeUser("password")));
        MockHttpSession session = new MockHttpSession();
        String anonymousSessionId = session.getId();

        mockMvc.perform(loginRequest(session, "customer", "password"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redirectUrl").doesNotExist())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS,
                        "true"
                ));

        assertNotEquals(anonymousSessionId, session.getId());
        assertNotNull(session.getAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY
        ));

        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void reactLoginContinuesSavedAuthorizationRequest() throws Exception {
        when(userRepository.findByUsername("customer"))
                .thenReturn(Optional.of(activeUser("password")));

        MvcResult authorization = mockMvc.perform(authorizationRequest())
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl(FRONTEND_LOGIN))
                .andReturn();
        MockHttpSession session =
                (MockHttpSession) authorization.getRequest().getSession(false);

        MvcResult login = mockMvc.perform(loginRequest(session, "customer", "password"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redirectUrl").isNotEmpty())
                .andReturn();
        String redirectUrl = objectMapper
                .readTree(login.getResponse().getContentAsByteArray())
                .get("redirectUrl")
                .asText();

        MvcResult callback = mockMvc.perform(get(URI.create(redirectUrl))
                        .session(session)
                        .accept(MediaType.TEXT_HTML))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string(
                        HttpHeaders.LOCATION,
                        org.hamcrest.Matchers.startsWith(
                                "http://localhost:3000/callback"
                        )
                ))
                .andReturn();

        String callbackUrl = callback.getResponse().getHeader(HttpHeaders.LOCATION);
        String authorizationCode = UriComponentsBuilder
                .fromUriString(callbackUrl)
                .build()
                .getQueryParams()
                .getFirst("code");
        assertNotNull(authorizationCode);

        MvcResult token = mockMvc.perform(post("/oauth2/token")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "authorization_code")
                        .param("code", authorizationCode)
                        .param("client_id", "rental-spa")
                        .param(
                                "redirect_uri",
                                "http://localhost:3000/callback"
                        )
                        .param("code_verifier", PKCE_VERIFIER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").isNotEmpty())
                .andExpect(jsonPath("$.id_token").doesNotExist())
                .andExpect(jsonPath("$.token_type").value("Bearer"))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        FRONTEND_ORIGIN
                ))
                .andExpect(header().doesNotExist(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS
                ))
                .andReturn();

        JsonNode tokenBody = objectMapper.readTree(
                token.getResponse().getContentAsByteArray()
        );
        assertFalse(tokenBody.has("refresh_token"));
        String accessToken = tokenBody.get("access_token").asText();
        Jwt jwt = jwtDecoder.decode(accessToken);
        assertEquals("42", jwt.getSubject());
        assertEquals("customer", jwt.getClaimAsString("username"));

        mockMvc.perform(get("/api/users/me")
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + accessToken
                        ))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("customer"));
    }

    private MockHttpServletRequestBuilder loginRequest(
            MockHttpSession session,
            String username,
            String password
    ) {
        return post("/auth/login")
                .session(session)
                .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("username", username)
                .param("password", password);
    }

    private MockHttpServletRequestBuilder authorizationRequest() {
        return get("/oauth2/authorize")
                .with(request -> {
                    request.setScheme("http");
                    request.setServerName("localhost");
                    request.setServerPort(8080);
                    return request;
                })
                .accept(MediaType.TEXT_HTML)
                .queryParam("response_type", "code")
                .queryParam("client_id", "rental-spa")
                .queryParam(
                        "scope",
                        "user.read user.write"
                )
                .queryParam(
                        "redirect_uri",
                        "http://localhost:3000/callback"
                )
                .queryParam("state", "state-123")
                .queryParam("code_challenge", PKCE_CHALLENGE)
                .queryParam("code_challenge_method", "S256");
    }

    private UserEntity activeUser(String rawPassword) {
        UserEntity user = new UserEntity();
        user.setId(42L);
        user.setUsername("customer");
        user.setFullName("Customer");
        user.setPassword(new BCryptPasswordEncoder().encode(rawPassword));
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }

    @RestController
    public static class ApiProbeController {

        @GetMapping("/api/users/me")
        public Map<String, String> currentUser() {
            return Map.of("username", "customer");
        }
    }

}
