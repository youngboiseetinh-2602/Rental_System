package com.javaweb.config;

import com.javaweb.converter.JwtAuthenticationConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;

    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel
    ) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
        }

        return message;
    }

    private void authenticate(
            StompHeaderAccessor accessor
    ) {
        String authorization =
                accessor.getFirstNativeHeader(
                        HttpHeaders.AUTHORIZATION
                );

        if (authorization == null
                || !authorization.startsWith("Bearer ")) {
            throw new BadCredentialsException(
                    "Thiếu access token"
            );
        }

        String token =
                authorization.substring(7).trim();

        if (token.isEmpty()) {
            throw new BadCredentialsException(
                    "Access token không được để trống"
            );
        }

        try {
            Jwt jwt = jwtDecoder.decode(token);

            AbstractAuthenticationToken authentication =
                    jwtAuthenticationConverter.convert(jwt);

            if (authentication == null) {
                throw new BadCredentialsException(
                        "Không thể tạo Authentication"
                );
            }

            accessor.setUser(authentication);

        } catch (JwtException exception) {
            throw new BadCredentialsException(
                    "Token không hợp lệ hoặc đã hết hạn",
                    exception
            );
        }
    }
}