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
    @WithMockUser(roles = "OWNER")
    void ownerRuleAllowsOwner() {
        assertEquals("ok", securedMethods.ownerMethod());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void ownerRuleRejectsDifferentRole() {
        assertThrows(AccessDeniedException.class, securedMethods::ownerMethod);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void ownerOrAdminRuleAllowsAdmin() {
        assertEquals("ok", securedMethods.ownerOrAdminMethod());
    }

    @Test
    @WithMockUser(roles = "OWNER")
    void ownerOrAdminRuleAllowsOwner() {
        assertEquals("ok", securedMethods.ownerOrAdminMethod());
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

        @PreAuthorize(AuthorizationRules.OWNER)
        String ownerMethod() {
            return "ok";
        }

        @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
        String ownerOrAdminMethod() {
            return "ok";
        }
    }
}
