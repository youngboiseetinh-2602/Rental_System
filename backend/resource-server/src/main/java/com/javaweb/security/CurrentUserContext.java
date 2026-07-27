package com.javaweb.security;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

// Doc userId va quyen cua user dang dang nhap tu SecurityContext.
@Component
public class CurrentUserContext {

    public Long getCurrentUserId() {
        Authentication authentication = getAuthentication();

        Object userId = null;
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            userId = jwtAuthentication.getToken().getClaim("userId");
        } else if (authentication.getPrincipal()
                instanceof OAuth2AuthenticatedPrincipal oauth2Principal) {
            userId = oauth2Principal.getAttribute("userId");
        }

        if (userId instanceof Number number) {
            return number.longValue();
        }
        if (userId instanceof String value) {
            return Long.valueOf(value);
        }

        throw new AuthenticationCredentialsNotFoundException("Authenticated user id is unavailable");
    }

    public boolean hasAuthority(String authority) {
        return getAuthentication().getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals(authority));
    }

    // Tra ve Authentication hop le hoac bao loi khi request chua xac thuc.
    private Authentication getAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("User is not authenticated");
        }

        return authentication;
    }
}
