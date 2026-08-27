package com.javaweb.config;

import com.javaweb.converter.JwtAuthenticationConverter;
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.FrontendAuthenticationFailureHandler;
import com.javaweb.security.FrontendAuthenticationSuccessHandler;
import com.javaweb.security.RestAccessDeniedHandler;
import com.javaweb.security.RestAuthenticationEntryPoint;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.util.Assert;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.messaging.context.SecurityContextChannelInterceptor;
/**
 * Cấu hình các chuỗi bộ lọc bảo mật cho máy chủ OAuth2, API sử dụng JWT và luồng đăng nhập React.
 */
@Configuration(proxyBeanMethods = false)
@EnableMethodSecurity
public class WebSecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(
            HttpSecurity http,
            RequestCache requestCache,
            @Value("${app.frontend.login-url}") String frontendLoginUrl
    ) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServer =
                OAuth2AuthorizationServerConfigurer.authorizationServer();
        MediaTypeRequestMatcher htmlRequestMatcher =
                new MediaTypeRequestMatcher(MediaType.TEXT_HTML);
        htmlRequestMatcher.setIgnoredMediaTypes(Set.of(MediaType.ALL));

        http
                .securityMatcher(authorizationServer.getEndpointsMatcher())
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .with(authorizationServer, Customizer.withDefaults())
                .authorizeHttpRequests(authorize -> authorize
                        .anyRequest().authenticated()
                )
                .requestCache(cache -> cache.requestCache(requestCache))
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint(frontendLoginUrl),
                                htmlRequestMatcher
                        )
                );

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain resourceServerSecurityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            CorsConfigurationSource corsConfigurationSource
    ) throws Exception {
        http
                .securityMatcher("/api/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/rental-properties",
                                "/api/rental-properties/*",
                                "/api/rental-properties/*/reviews"
                        ).permitAll()

                        .requestMatchers("/api/admin/**")
                        .access(require(AuthorizationRules.ADMIN))
                        .requestMatchers(HttpMethod.GET, "/api/rooms/**")
                        .access(require(AuthorizationRules.ROOM_READ))
                        .requestMatchers("/api/rooms/**")
                        .access(require(AuthorizationRules.ROOM_WRITE_OWNER_OR_ADMIN))
                        .requestMatchers(HttpMethod.GET, "/api/owners/me/rental-requests")
                        .access(require(AuthorizationRules.BOOKING_READ_OWNER))
                        .requestMatchers(HttpMethod.GET, "/api/owners/me/rental-properties")
                        .access(require(AuthorizationRules.ROOM_READ_OWNER))
                        .requestMatchers("/api/owners/**")
                        .access(require(AuthorizationRules.ROOM_WRITE_OWNER))
                        .requestMatchers(HttpMethod.GET, "/api/rental-requests/**")
                        .access(require(AuthorizationRules.BOOKING_READ_OWNER_OR_ADMIN))
                        .requestMatchers("/api/rental-requests/**")
                        .access(require(AuthorizationRules.BOOKING_WRITE_OWNER_OR_ADMIN))
                        .requestMatchers(
                                "/api/images/**",
                                "/api/room-types/**",
                                "/api/facilities/**"
                        ).access(require(AuthorizationRules.ROOM_WRITE_OWNER_OR_ADMIN))
                        .requestMatchers("/api/rental-properties/**")
                        .access(require(AuthorizationRules.ROOM_WRITE_OWNER_OR_ADMIN))
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me/rental-requests/**"
                        ).access(require(AuthorizationRules.BOOKING_READ_CUSTOMER))
                        .requestMatchers(
                                "/api/users/me/rental-requests/**"
                        ).access(require(AuthorizationRules.BOOKING_WRITE_CUSTOMER))
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me/notifications/**",
                                "/api/users/me"
                        ).access(require(AuthorizationRules.USER_READ))
                        .requestMatchers(
                                "/api/users/me/notifications/**",
                                "/api/users/me",
                                "/api/users/me/password"
                        ).access(require(AuthorizationRules.USER_WRITE))
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/system/imagekit/auth"
                        ).access(require(AuthorizationRules.USER_WRITE))
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me/rental-properties/**",
                                "/api/users/me/reviews/**"
                        ).access(require(AuthorizationRules.ROOM_READ_CUSTOMER))
                        .requestMatchers(
                                "/api/users/me/rental-properties/**",
                                "/api/users/me/reviews/**"
                        ).access(require(AuthorizationRules.ROOM_WRITE_CUSTOMER))
                        .requestMatchers(
                                "/api/conversations",
                                "/api/conversations/**",
                                "/api/messages/**"
                        ).access(require(AuthorizationRules.CHAT_USER))
                        .anyRequest().denyAll()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                );

        return http.build();
    }

    @Bean
    @Order(3)
    public SecurityFilterChain applicationSecurityFilterChain(
            HttpSecurity http,
            DaoAuthenticationProvider daoAuthenticationProvider,
            FrontendAuthenticationSuccessHandler authenticationSuccessHandler,
            FrontendAuthenticationFailureHandler authenticationFailureHandler,
            RequestCache requestCache,
            @Value("${app.frontend.login-url}") String frontendLoginUrl
    ) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/auth/login",
                                "/error",
                                "/favicon.ico",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/ws",
                                "/ws/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(daoAuthenticationProvider)
                .csrf(AbstractHttpConfigurer::disable)
                .requestCache(cache -> cache.requestCache(requestCache))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .formLogin(form -> form
                        .loginPage("/auth/login")
                        .loginProcessingUrl("/auth/login")
                        .successHandler(authenticationSuccessHandler)
                        .failureHandler(authenticationFailureHandler)
                        .permitAll()
                )
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(
                                new LoginUrlAuthenticationEntryPoint(frontendLoginUrl)
                        )
                );

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
    public JwtDecoder jwtDecoder(
            JWKSource<SecurityContext> jwkSource,
            @Value("${authorization-server.issuer}") String issuer
    ) {
        NimbusJwtDecoder decoder = (NimbusJwtDecoder)
                OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));
        return decoder;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${security.cors.allowed-origins}") List<String> allowedOrigins
    ) {
        Assert.notEmpty(allowedOrigins, "CORS_ALLOWED_ORIGINS must not be empty");
        Assert.isTrue(
                allowedOrigins.stream().allMatch(origin ->
                        origin != null
                                && !origin.isBlank()
                                && !origin.contains("*")),
                "CORS_ALLOWED_ORIGINS must contain exact origins, not wildcards"
        );

        CorsConfiguration api = corsConfiguration(
                allowedOrigins,
                List.of(
                        HttpMethod.GET.name(),
                        HttpMethod.POST.name(),
                        HttpMethod.PUT.name(),
                        HttpMethod.PATCH.name(),
                        HttpMethod.DELETE.name(),
                        HttpMethod.OPTIONS.name()
                ),
                List.of(
                        HttpHeaders.AUTHORIZATION,
                        HttpHeaders.CONTENT_TYPE,
                        HttpHeaders.ACCEPT
                ),
                false
        );
        CorsConfiguration tokenEndpoint = corsConfiguration(
                allowedOrigins,
                List.of(HttpMethod.POST.name()),
                List.of(HttpHeaders.ACCEPT, HttpHeaders.CONTENT_TYPE),
                false
        );
        CorsConfiguration browserReadableMetadata = corsConfiguration(
                allowedOrigins,
                List.of(HttpMethod.GET.name()),
                List.of(HttpHeaders.ACCEPT),
                false
        );
        CorsConfiguration frontendAuthentication = corsConfiguration(
                allowedOrigins,
                List.of(
                        HttpMethod.POST.name(),
                        HttpMethod.OPTIONS.name()
                ),
                List.of(
                        HttpHeaders.ACCEPT,
                        HttpHeaders.CONTENT_TYPE
                ),
                true
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/auth/**", frontendAuthentication);
        source.registerCorsConfiguration("/api/**", api);
        source.registerCorsConfiguration("/oauth2/token", tokenEndpoint);
        source.registerCorsConfiguration("/oauth2/jwks", browserReadableMetadata);
        source.registerCorsConfiguration("/.well-known/**", browserReadableMetadata);
        return source;
    }

    private CorsConfiguration corsConfiguration(
            List<String> allowedOrigins,
            List<String> methods,
            List<String> headers,
            boolean allowCredentials
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(methods);
        configuration.setAllowedHeaders(headers);
        configuration.setAllowCredentials(allowCredentials);
        configuration.setMaxAge(3600L);
        return configuration;
    }

    private static WebExpressionAuthorizationManager require(String expression) {
        return new WebExpressionAuthorizationManager(expression);
    }
}
