package com.javaweb.security;

import java.util.List;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.Assert;

public final class JwtAudienceValidator implements OAuth2TokenValidator<Jwt> {

    private final String requiredAudience;

    public JwtAudienceValidator(String requiredAudience) {
        Assert.hasText(requiredAudience, "requiredAudience must not be blank");
        this.requiredAudience = requiredAudience;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        List<String> audiences = jwt.getAudience();
        if (audiences != null && audiences.contains(requiredAudience)) {
            return OAuth2TokenValidatorResult.success();
        }

        OAuth2Error error = new OAuth2Error(
                OAuth2ErrorCodes.INVALID_TOKEN,
                "JWT does not contain the required audience",
                null
        );
        return OAuth2TokenValidatorResult.failure(error);
    }
}
