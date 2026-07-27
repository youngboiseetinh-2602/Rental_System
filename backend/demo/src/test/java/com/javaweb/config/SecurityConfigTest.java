package com.javaweb.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class SecurityConfigTest {

    @Test
    void passwordEncoderMatchesLegacyUnprefixedBcryptUserPasswords() {
        PasswordEncoder passwordEncoder = new SecurityConfig().passwordEncoder();
        String legacyHash = new BCryptPasswordEncoder().encode("correct-password");

        assertFalse(legacyHash.startsWith("{bcrypt}"));
        assertTrue(passwordEncoder.matches("correct-password", legacyHash));
    }
}
