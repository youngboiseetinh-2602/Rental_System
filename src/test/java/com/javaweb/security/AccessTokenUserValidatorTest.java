package com.javaweb.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import com.javaweb.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;

class AccessTokenUserValidatorTest {

    private final UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
    private final AccessTokenUserValidator validator = new AccessTokenUserValidator(userRepository);

    @Test
    void returnsUserWhenAccountIsActiveAndHasRole() {
        UserEntity user = createUser(UserStatus.ACTIVE);
        when(userRepository.findByUsername("customer")).thenReturn(Optional.of(user));

        UserEntity result = validator.validateAndGetUser("customer");

        assertSame(user, result);
    }

    @ParameterizedTest
    @EnumSource(value = UserStatus.class, names = {"INACTIVE", "LOCKED"})
    void rejectsUserWhenAccountIsNotActive(UserStatus status) {
        when(userRepository.findByUsername("customer"))
                .thenReturn(Optional.of(createUser(status)));

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> validator.validateAndGetUser("customer")
        );

        assertEquals(OAuth2ErrorCodes.INVALID_GRANT, exception.getError().getErrorCode());
    }

    @Test
    void rejectsUserWhenAccountNoLongerExists() {
        when(userRepository.findByUsername("customer")).thenReturn(Optional.empty());

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> validator.validateAndGetUser("customer")
        );

        assertEquals(OAuth2ErrorCodes.INVALID_GRANT, exception.getError().getErrorCode());
    }

    @Test
    void rejectsUserWhenRoleIsMissing() {
        UserEntity user = createUser(UserStatus.ACTIVE);
        user.setRole(null);
        when(userRepository.findByUsername("customer")).thenReturn(Optional.of(user));

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> validator.validateAndGetUser("customer")
        );

        assertEquals(OAuth2ErrorCodes.INVALID_GRANT, exception.getError().getErrorCode());
    }

    private UserEntity createUser(UserStatus status) {
        UserEntity user = new UserEntity();
        user.setId(10L);
        user.setUsername("customer");
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(status);
        return user;
    }
}
