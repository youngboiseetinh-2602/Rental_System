// /new/ - File moi cho thong ke doanh thu.
package com.javaweb.service.impl;

import com.javaweb.entity.*;
import com.javaweb.enums.ContractStatus;
import com.javaweb.enums.UserRole;
import com.javaweb.repository.*;
import com.javaweb.security.CurrentUserContext;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RevenueServiceImplTest {
    @Mock MonthlyRevenueRepository revenues;
    @Mock ContractRepository contracts;
    @Mock UserRepository users;
    @Mock CurrentUserContext currentUser;
    RevenueServiceImpl service;
    UserEntity owner;

    @BeforeEach
    void setUp() {
        // UTC is still September: the business month must be October in Vietnam.
        Clock clock = Clock.fixed(Instant.parse("2026-09-30T18:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        service = new RevenueServiceImpl(revenues, contracts, users, currentUser, clock);
        owner = new UserEntity();
        owner.setId(7L);
        owner.setRole(UserRole.OWNER);
    }

    MonthlyRevenueEntity row(String amount) {
        MonthlyRevenueEntity row = new MonthlyRevenueEntity();
        row.setUser(owner);
        row.setYear((short) 2026);
        row.setMonth((byte) 10);
        row.setRevenue(new BigDecimal(amount));
        row.setCommissionPercent(new BigDecimal("5"));
        row.calculateProfit();
        return row;
    }

    ContractEntity contract() {
        RentalPropertyEntity property = new RentalPropertyEntity();
        property.setOwner(owner);
        RoomTypeEntity type = new RoomTypeEntity();
        type.setRentalProperty(property);
        type.setMonthlyPrice(new BigDecimal("999999"));
        RoomEntity room = new RoomEntity();
        room.setRoomType(type);
        ContractEntity contract = new ContractEntity();
        contract.setRoom(room);
        contract.setStatus(ContractStatus.APPROVED);
        contract.setStartDate(LocalDate.of(2026, 10, 31));
        contract.setEndDate(LocalDate.of(2026, 12, 31));
        contract.setRentPrice(new BigDecimal("100.00"));
        return contract;
    }

    @Test
    void existingMonthNeverReadsContracts() {
        when(currentUser.getCurrentUserId()).thenReturn(7L);
        when(users.findByIdForRevenueUpdate(7L)).thenReturn(Optional.of(owner));
        when(revenues.findByUser_IdAndYearAndMonth(7L, (short) 2026, (byte) 10))
                .thenReturn(Optional.of(row("100.00")));
        assertEquals(new BigDecimal("95.00"), service.getOwnerCurrentRevenue().profit());
        verifyNoInteractions(contracts);
    }

    @Test
    void approvalIncrementsSnapshotPriceWithoutContractScan() {
        when(users.findByIdForRevenueUpdate(7L)).thenReturn(Optional.of(owner));
        MonthlyRevenueEntity row = row("200.00");
        when(revenues.findByUser_IdAndYearAndMonth(7L, (short) 2026, (byte) 10)).thenReturn(Optional.of(row));
        service.addApprovedContract(contract());
        assertEquals(new BigDecimal("300.00"), row.getRevenue());
        assertEquals(new BigDecimal("285.00"), row.getProfit());
        verifyNoInteractions(contracts);
    }

    @Test
    void missingMonthIncludesNewContractOnlyOnce() {
        when(users.findByIdForRevenueUpdate(7L)).thenReturn(Optional.of(owner));
        when(contracts.sumRevenueForMonth(eq(7L), eq(LocalDate.of(2026, 10, 1)),
                eq(LocalDate.of(2026, 10, 31)), anyList())).thenReturn(new BigDecimal("300.00"));
        when(revenues.save(any())).thenAnswer(call -> call.getArgument(0));
        service.addApprovedContract(contract());
        verify(revenues).save(argThat(row -> row.getRevenue().compareTo(new BigDecimal("300")) == 0
                && row.getProfit().compareTo(new BigDecimal("285")) == 0));
        var order = inOrder(contracts);
        order.verify(contracts).flush();
        order.verify(contracts).sumRevenueForMonth(anyLong(), any(), any(), anyList());
    }

    @Test
    void futureOrCancelledContractsDoNotChangeRevenue() {
        ContractEntity future = contract();
        future.setStartDate(LocalDate.of(2026, 11, 1));
        service.addApprovedContract(future);
        ContractEntity cancelled = contract();
        cancelled.setStatus(ContractStatus.CANCELLED);
        service.addApprovedContract(cancelled);
        verifyNoInteractions(revenues, users, contracts);
    }

    @Test
    void historiesAndAdminCurrentNeverReadContracts() {
        when(currentUser.getCurrentUserId()).thenReturn(7L);
        when(revenues.findAllByUser_IdOrderByYearDescMonthDesc(7L)).thenReturn(List.of(row("100.00")));
        when(revenues.sumOwnerRevenue((short) 2026, (byte) 10)).thenReturn(new BigDecimal("60000000.00"));
        assertEquals(1, service.getOwnerHistory().size());
        assertEquals(new BigDecimal("3000000.00"), service.getAdminCurrentRevenue().profit());
        assertTrue(service.getAdminHistory().isEmpty());
        service.getOwnersMissingRevenue();
        verify(users).findOwnersMissingRevenue((short) 2026, (byte) 10);
        verifyNoInteractions(contracts);
    }
}
