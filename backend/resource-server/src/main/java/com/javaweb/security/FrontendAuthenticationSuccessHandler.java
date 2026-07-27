package com.javaweb.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Component;

@Component
public class FrontendAuthenticationSuccessHandler
        implements AuthenticationSuccessHandler {

    private final ObjectMapper objectMapper;
    private final RequestCache requestCache;
    private final URI issuer;

    public FrontendAuthenticationSuccessHandler(
            ObjectMapper objectMapper,
            RequestCache requestCache,
            @Value("${authorization-server.issuer}") String issuer
    ) {
        this.objectMapper = objectMapper;
        this.requestCache = requestCache;
        this.issuer = URI.create(issuer);
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        SavedRequest savedRequest = requestCache.getRequest(request, response);
        String redirectUrl = allowedAuthorizationRequest(savedRequest);

        if (savedRequest != null) {
            requestCache.removeRequest(request, response);
        }

        Map<String, Object> responseBody = new LinkedHashMap<>();
        responseBody.put("redirectUrl", redirectUrl);

        response.setStatus(HttpServletResponse.SC_OK);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        response.setHeader(HttpHeaders.PRAGMA, "no-cache");
        objectMapper.writeValue(response.getOutputStream(), responseBody);
    }

    private String allowedAuthorizationRequest(SavedRequest savedRequest) {
        if (savedRequest == null) {
            return null;
        }

        try {
            URI redirect = URI.create(savedRequest.getRedirectUrl());
            String issuerPath = issuer.getPath() == null
                    ? ""
                    : issuer.getPath().replaceAll("/+$", "");

            boolean sameOrigin = Objects.equals(issuer.getScheme(), redirect.getScheme())
                    && Objects.equals(issuer.getHost(), redirect.getHost())
                    && effectivePort(issuer) == effectivePort(redirect);
            boolean authorizationEndpoint =
                    (issuerPath + "/oauth2/authorize").equals(redirect.getPath());

            return sameOrigin && authorizationEndpoint
                    ? redirect.toString()
                    : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private int effectivePort(URI uri) {
        if (uri.getPort() >= 0) {
            return uri.getPort();
        }
        return "https".equalsIgnoreCase(uri.getScheme()) ? 443 : 80;
    }
}
