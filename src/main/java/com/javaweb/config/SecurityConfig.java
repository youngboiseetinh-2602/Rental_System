package com.javaweb.config;

import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.RestAccessDeniedHandler;
import com.javaweb.security.RestAuthenticationEntryPoint;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// Cau hinh cac filter chain va phan quyen role cho OAuth2 va API.
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(
            HttpSecurity http
    ) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer =
                OAuth2AuthorizationServerConfigurer.authorizationServer();

        http
                .securityMatcher(authorizationServerConfigurer.getEndpointsMatcher())
                .cors(Customizer.withDefaults())
                .with(authorizationServerConfigurer, Customizer.withDefaults())
                .authorizeHttpRequests(authorize -> authorize
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint("/login"),
                                new MediaTypeRequestMatcher(MediaType.TEXT_HTML)
                        )
                );

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain resourceServerSecurityFilterChain(
            HttpSecurity http,
            Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler
    ) throws Exception {
        http
                .securityMatcher("/api/**")
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/register"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/rental-properties",
                                "/api/rental-properties/*",
                                "/api/rental-properties/*/reviews"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/**")
                        .access(require(AuthorizationRules.ADMIN))
                        .requestMatchers("/api/admin/**")
                        .access(require(AuthorizationRules.ADMIN))
                        .requestMatchers(HttpMethod.GET, "/api/owners/**")
                        .access(require(AuthorizationRules.OWNER))
                        .requestMatchers("/api/owners/**")
                        .access(require(AuthorizationRules.OWNER))
                        .requestMatchers(
                                "/api/rental-requests/**",
                                "/api/images/**",
                                "/api/room-types/**",
                                "/api/facilities/**",
                                "/api/rooms/**"
                        ).access(require(AuthorizationRules.OWNER_OR_ADMIN))
                        .requestMatchers("/api/rental-properties/**")
                        .access(require(AuthorizationRules.OWNER_OR_ADMIN))
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me/rental-requests/**"
                        ).access(require(AuthorizationRules.CUSTOMER))
                        .requestMatchers(
                                "/api/users/me/rental-requests/**",
                                "/api/users/me/rental-properties/**",
                                "/api/users/me/reviews/**"
                        ).access(require(AuthorizationRules.CUSTOMER))
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me/notifications/**"
                        ).access(require(AuthorizationRules.USER))
                        .requestMatchers("/api/users/me/notifications/**")
                        .access(require(AuthorizationRules.USER))
                        .requestMatchers(HttpMethod.GET, "/api/users/me")
                        .access(require(AuthorizationRules.USER))
                        .requestMatchers(
                                "/api/users/me",
                                "/api/users/me/password"
                        ).access(require(AuthorizationRules.USER))
                        .anyRequest().denyAll()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter)
                        )
                );

        return http.build();
    }

    @Bean
    @Order(3)
    public SecurityFilterChain applicationSecurityFilterChain(
            HttpSecurity http
    ) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/login",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/error"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings(
            @Value("${authorization-server.issuer}") String issuer
    ) {
        return AuthorizationServerSettings.builder()
                .issuer(issuer)
                .build();
    }

    @Bean
    public Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter roleConverter = new JwtGrantedAuthoritiesConverter();
        roleConverter.setAuthoritiesClaimName("roles");
        roleConverter.setAuthorityPrefix("ROLE_");

        return jwt -> new JwtAuthenticationToken(
                jwt,
                roleConverter.convert(jwt),
                jwt.getSubject()
        );
    }

    // Chuyen bieu thuc role thanh bo kiem tra quyen cho HTTP request.
    private static WebExpressionAuthorizationManager require(String expression) {
        return new WebExpressionAuthorizationManager(expression);
    }

    // Cung cap quy tac CORS de quy dinh frontend nao duoc phep goi backend,
    // cung cac HTTP method va request header duoc chap nhan.
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origin}") String allowedOrigin
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin));
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE"
        ));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin"
        ));
        configuration.setExposedHeaders(List.of(
                "Location",
                "WWW-Authenticate"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
