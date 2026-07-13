package com.javaweb.customException;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

public class InvalidTokenException extends OAuth2AuthenticationException {

    public InvalidTokenException(String message) {
        super(new OAuth2Error("invalid_token", message, null));
    }
}
