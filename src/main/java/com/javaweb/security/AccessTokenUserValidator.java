package com.javaweb.security;

import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserStatus;
import com.javaweb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccessTokenUserValidator {

    private final UserRepository userRepository;

    // Chi tra ve user du dieu kien nhan access token.
    public UserEntity validateAndGetUser(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(this::invalidUserGrant);

        if (user.getStatus() != UserStatus.ACTIVE || user.getRole() == null) {
            throw invalidUserGrant();
        }

        return user;
    }

    private OAuth2AuthenticationException invalidUserGrant() {
        OAuth2Error error = new OAuth2Error(
                OAuth2ErrorCodes.INVALID_GRANT,
                "User account is not eligible to receive an access token",
                null
        );
        return new OAuth2AuthenticationException(error);
    }
}
