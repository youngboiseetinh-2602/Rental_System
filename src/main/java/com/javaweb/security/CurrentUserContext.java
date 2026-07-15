package com.javaweb.security;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserContext {

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2AuthenticatedPrincipal oauth2Principal) {
            Object userId = oauth2Principal.getAttribute("userId");
            if (userId instanceof Number number) {
                return number.longValue();
            }
            if (userId instanceof String value) {
                return Long.valueOf(value);
            }
        }

        throw new AuthenticationCredentialsNotFoundException("Authenticated user id is unavailable");
    }
}
