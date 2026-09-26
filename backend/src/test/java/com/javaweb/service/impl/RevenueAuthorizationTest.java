// /new/ - File moi cho thong ke doanh thu.
package com.javaweb.service.impl;

import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.MonthlyRevenueRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.RevenueService;
import java.time.Clock;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringJUnitConfig(RevenueAuthorizationTest.Config.class)
class RevenueAuthorizationTest {
    @Configuration
    @EnableMethodSecurity
    static class Config {
        @Bean MonthlyRevenueRepository revenues() { return mock(MonthlyRevenueRepository.class); }
        @Bean CurrentUserContext currentUser() { return mock(CurrentUserContext.class); }
        @Bean RevenueService revenueService(MonthlyRevenueRepository revenues, CurrentUserContext currentUser) {
            return new RevenueServiceImpl(revenues, mock(ContractRepository.class),
                    mock(UserRepository.class), currentUser, Clock.systemUTC());
        }
    }
    @Autowired RevenueService service;
    @Autowired CurrentUserContext currentUser;
    @Autowired MonthlyRevenueRepository revenues;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customerCannotAccessEitherRevenueScope() {
        assertThrows(AccessDeniedException.class, service::getOwnerCurrentRevenue);
        assertThrows(AccessDeniedException.class, service::getOwnerHistory);
        assertThrows(AccessDeniedException.class, service::getAdminCurrentRevenue);
        assertThrows(AccessDeniedException.class, service::getAdminHistory);
        assertThrows(AccessDeniedException.class, service::getOwnersMissingRevenue);
    }

    @Test
    @WithMockUser(roles = "OWNER")
    void ownerHistoryUsesAuthenticatedIdAndCannotReadAdminData() {
        when(currentUser.getCurrentUserId()).thenReturn(42L);
        when(revenues.findAllByUser_IdOrderByYearDescMonthDesc(42L)).thenReturn(List.of());
        assertTrue(service.getOwnerHistory().isEmpty());
        verify(revenues).findAllByUser_IdOrderByYearDescMonthDesc(42L);
        assertThrows(AccessDeniedException.class, service::getAdminHistory);
        assertThrows(AccessDeniedException.class, service::getOwnersMissingRevenue);
    }
}
