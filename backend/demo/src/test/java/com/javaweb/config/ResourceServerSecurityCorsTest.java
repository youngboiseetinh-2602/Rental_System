package com.javaweb.config;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.javaweb.converter.JwtAuthenticationConverter;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CustomUserDetailsService;
import com.javaweb.security.FrontendAuthenticationFailureHandler;
import com.javaweb.security.FrontendAuthenticationSuccessHandler;
import com.javaweb.security.JwtTokenCustomizer;
import com.javaweb.security.RestAccessDeniedHandler;
import com.javaweb.security.RestAuthenticationEntryPoint;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(controllers = ResourceServerSecurityCorsTest.ApiProbeController.class)
@Import({
        SecurityConfig.class,
        CustomUserDetailsService.class,
        FrontendAuthenticationFailureHandler.class,
        FrontendAuthenticationSuccessHandler.class,
        JwtAuthenticationConverter.class,
        JwtKeyConfig.class,
        JwtTokenCustomizer.class,
        RegisteredClientConfig.class,
        WebSecurityConfig.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class,
        ResourceServerSecurityCorsTest.ApiProbeController.class
})
class ResourceServerSecurityCorsTest {

    private static final String FRONTEND_URL = "http://localhost:3000";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void allowsConfiguredFrontendPreflightWithoutCredentials() throws Exception {
        mockMvc.perform(options("/api/users/me")
                        .header(HttpHeaders.ORIGIN, FRONTEND_URL)
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD,
                                HttpMethod.GET.name()
                        )
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                                "Authorization, Content-Type"
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        FRONTEND_URL
                ))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                        containsString(HttpMethod.GET.name())
                ))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        containsString(HttpHeaders.AUTHORIZATION)
                ))
                .andExpect(header().doesNotExist(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS
                ));
    }

    @Test
    void rejectsUnknownOriginAndUnknownRequestHeader() throws Exception {
        mockMvc.perform(options("/api/users/me")
                        .header(
                                HttpHeaders.ORIGIN,
                                "http://attacker.example"
                        )
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD,
                                HttpMethod.GET.name()
                        ))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN
                ));

        mockMvc.perform(options("/api/users/me")
                        .header(HttpHeaders.ORIGIN, FRONTEND_URL)
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD,
                                HttpMethod.GET.name()
                        )
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                                "X-Api-Key"
                        ))
                .andExpect(status().isForbidden());
    }

    @Test
    void corsHeadersArePresentOnPublicAndUnauthorizedResponses()
            throws Exception {
        mockMvc.perform(get("/api/public/ping")
                        .header(HttpHeaders.ORIGIN, FRONTEND_URL))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        FRONTEND_URL
                ));

        mockMvc.perform(get("/api/users/me")
                        .header(HttpHeaders.ORIGIN, FRONTEND_URL))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        FRONTEND_URL
                ))
                .andExpect(header().doesNotExist(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS
                ))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void publicMutationDoesNotRequireCsrfCookie() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .header(HttpHeaders.ORIGIN, FRONTEND_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"customer01\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        FRONTEND_URL
                ));
    }

    @Test
    void protectedRouteRequiresBothScopeAndRoleAndCreatesNoSession()
            throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header(HttpHeaders.ORIGIN, FRONTEND_URL)
                        .with(jwt().authorities(
                                new SimpleGrantedAuthority("SCOPE_user.read"),
                                new SimpleGrantedAuthority("ROLE_CUSTOMER")
                        )))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));

        mockMvc.perform(get("/api/users/me")
                        .with(jwt().authorities(
                                new SimpleGrantedAuthority("ROLE_CUSTOMER")
                        )))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users/me")
                        .with(jwt().authorities(
                                new SimpleGrantedAuthority("SCOPE_user.read")
                        )))
                .andExpect(status().isForbidden());
    }

    @RestController
    public static class ApiProbeController {

        @GetMapping("/api/public/ping")
        Map<String, String> publicPing() {
            return Map.of("status", "ok");
        }

        @GetMapping("/api/users/me")
        Map<String, String> currentUser() {
            return Map.of("username", "customer01");
        }

        @PostMapping("/api/auth/register")
        Map<String, String> register(
                @RequestBody(required = false) Map<String, Object> request
        ) {
            return Map.of("status", "registered");
        }
    }
}
