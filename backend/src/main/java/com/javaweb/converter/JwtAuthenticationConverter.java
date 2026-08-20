package com.javaweb.converter;

import java.util.ArrayList;
import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

/**
 * Chuyển đổi JWT thành đối tượng xác thực, kết hợp quyền từ scope và vai trò của người dùng.
 */
@Component
public class JwtAuthenticationConverter
        implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter scopeConverter =
            new JwtGrantedAuthoritiesConverter();
    private final JwtGrantedAuthoritiesConverter roleConverter =
            new JwtGrantedAuthoritiesConverter();

    public JwtAuthenticationConverter() {
        roleConverter.setAuthoritiesClaimName("roles");
        roleConverter.setAuthorityPrefix("ROLE_");
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        List<org.springframework.security.core.GrantedAuthority> authorities =
                new ArrayList<>();
        authorities.addAll(scopeConverter.convert(jwt));
        authorities.addAll(roleConverter.convert(jwt));

        String principalName = jwt.getClaimAsString("username");
        if (principalName == null || principalName.isBlank()) {
            principalName = jwt.getSubject();
        }

        return new JwtAuthenticationToken(jwt, authorities, principalName);
    }
}
