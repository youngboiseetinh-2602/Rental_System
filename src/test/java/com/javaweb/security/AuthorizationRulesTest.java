package com.javaweb.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

@SpringJUnitConfig(AuthorizationRulesTest.TestConfiguration.class)
class AuthorizationRulesTest {

    @Autowired
    private SecuredMethods securedMethods;

    @Test
    @WithAnonymousUser
    void publicRuleAllowsAnonymousUser() {
        assertEquals("ok", securedMethods.publicMethod());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_OWNER", "SCOPE_room.read"})
    void ownerReadRuleAllowsOwnerWithReadScope() {
        assertEquals("ok", securedMethods.ownerRead());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_OWNER", "SCOPE_room.read"})
    void ownerWriteRuleRejectsOwnerWithoutWriteScope() {
        assertThrows(AccessDeniedException.class, securedMethods::ownerWrite);
    }

    @Test
    @WithMockUser(authorities = {"ROLE_OWNER", "SCOPE_room.write"})
    void ownerWriteRuleAllowsOwnerWithWriteScope() {
        assertEquals("ok", securedMethods.ownerWrite());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_CUSTOMER", "SCOPE_room.write"})
    void ownerWriteRuleRejectsDifferentRole() {
        assertThrows(AccessDeniedException.class, securedMethods::ownerWrite);
    }

    @Test
    @WithMockUser(authorities = {"ROLE_ADMIN", "SCOPE_room.write"})
    void ownerOrAdminWriteRuleAllowsAdminWithWriteScope() {
        assertEquals("ok", securedMethods.ownerOrAdminWrite());
    }

    @Configuration(proxyBeanMethods = false)
    @EnableMethodSecurity
    static class TestConfiguration {

        @Bean
        SecuredMethods securedMethods() {
            return new SecuredMethods();
        }
    }

    static class SecuredMethods {

        @PreAuthorize(AuthorizationRules.PUBLIC)
        String publicMethod() {
            return "ok";
        }

        @PreAuthorize(AuthorizationRules.OWNER_READ)
        String ownerRead() {
            return "ok";
        }

        @PreAuthorize(AuthorizationRules.OWNER_WRITE)
        String ownerWrite() {
            return "ok";
        }

        @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN_WRITE)
        String ownerOrAdminWrite() {
            return "ok";
        }
    }
}
