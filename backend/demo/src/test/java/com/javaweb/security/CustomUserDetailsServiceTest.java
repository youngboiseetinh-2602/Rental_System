package com.javaweb.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import com.javaweb.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

class CustomUserDetailsServiceTest {

    private final UserRepository userRepository =
            org.mockito.Mockito.mock(UserRepository.class);
    private final CustomUserDetailsService userDetailsService =
            new CustomUserDetailsService(userRepository);

    @Test
    void mapsActiveDatabaseUserAndRole() {
        when(userRepository.findByUsername("owner"))
                .thenReturn(Optional.of(user(UserStatus.ACTIVE)));

        UserDetails result = userDetailsService.loadUserByUsername("owner");

        assertTrue(result.isEnabled());
        assertTrue(result.isAccountNonLocked());
        assertTrue(result.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_OWNER")));
    }

    @ParameterizedTest
    @EnumSource(value = UserStatus.class, names = {"INACTIVE", "LOCKED"})
    void mapsAccountStatus(UserStatus status) {
        when(userRepository.findByUsername("owner"))
                .thenReturn(Optional.of(user(status)));

        UserDetails result = userDetailsService.loadUserByUsername("owner");

        if (status == UserStatus.INACTIVE) {
            assertFalse(result.isEnabled());
            assertTrue(result.isAccountNonLocked());
        } else {
            assertTrue(result.isEnabled());
            assertFalse(result.isAccountNonLocked());
        }
    }

    @Test
    void hidesWhetherUsernameExists() {
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        assertThrows(
                UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("missing")
        );
    }

    private UserEntity user(UserStatus status) {
        UserEntity user = new UserEntity();
        user.setId(7L);
        user.setUsername("owner");
        user.setPassword("$2a$10$legacyBcryptHash");
        user.setRole(UserRole.OWNER);
        user.setStatus(status);
        return user;
    }
}
