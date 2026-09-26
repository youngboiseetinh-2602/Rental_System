// /new/ - File moi cho thong ke doanh thu.
package com.javaweb.service.impl;

import com.javaweb.converter.ContractConverter;
import com.javaweb.customException.ConflictException;
import com.javaweb.entity.*;
import com.javaweb.enums.*;
import com.javaweb.repository.*;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.NotificationService;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:revenue;MODE=MySQL;NON_KEYWORDS=YEAR,MONTH;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop", "spring.jpa.show-sql=false",
        "spring.config.import=", "logging.level.org.hibernate.SQL=OFF",
        "logging.level.org.springframework=INFO"
}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ContextConfiguration(classes = RevenueIntegrationTest.Config.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class RevenueIntegrationTest {
    @TestConfiguration
    @EntityScan("com.javaweb.entity")
    @EnableJpaRepositories("com.javaweb.repository")
    @Import({RevenueServiceImpl.class, ContractServiceImpl.class})
    static class Config {
        @Bean Clock revenueClock() {
            return Clock.system(ZoneId.of("Asia/Ho_Chi_Minh"));
        }
    }

    @Autowired RevenueServiceImpl revenueService;
    @Autowired ContractServiceImpl contractService;
    @Autowired MonthlyRevenueRepository revenues;
    @Autowired ContractRepository contracts;
    @Autowired UserRepository users;
    @Autowired EntityManager em;
    @Autowired PlatformTransactionManager transactionManager;
    @MockitoBean CurrentUserContext currentUser;
    @MockitoBean NotificationService notifications;
    @MockitoBean ContractConverter converter;
    TransactionTemplate transaction;
    Long ownerId;
    Long tenantId;
    Long roomTypeId;
    YearMonth month = YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh"));

    @BeforeEach
    void seed() {
        transaction = new TransactionTemplate(transactionManager);
        transaction.executeWithoutResult(status -> {
            UserEntity owner = user(UserRole.OWNER);
            UserEntity tenant = user(UserRole.CUSTOMER);
            ownerId = owner.getId();
            tenantId = tenant.getId();
            RentalTypeEntity rentalType = new RentalTypeEntity();
            rentalType.setName("Test type");
            em.persist(rentalType);
            RentalPropertyEntity property = new RentalPropertyEntity();
            property.setName("Test property");
            property.setOwner(owner);
            property.setRentalType(rentalType);
            em.persist(property);
            RoomTypeEntity roomType = new RoomTypeEntity();
            roomType.setName("Test room type");
            roomType.setMonthlyPrice(new BigDecimal("9999.00"));
            roomType.setRentalProperty(property);
            em.persist(roomType);
            roomTypeId = roomType.getId();
        });
        when(currentUser.getCurrentUserId()).thenReturn(ownerId);
    }

    UserEntity user(UserRole role) {
        UserEntity user = new UserEntity();
        user.setUsername(UUID.randomUUID().toString());
        user.setFullName("Test " + role);
        user.setPassword("test-only");
        user.setRole(role);
        em.persist(user);
        return user;
    }

    Long contract(ContractStatus status, LocalDate start, LocalDate end, String price) {
        return transaction.execute(tx -> {
            RoomEntity room = new RoomEntity();
            room.setName("Test room");
            room.setRoomType(em.getReference(RoomTypeEntity.class, roomTypeId));
            em.persist(room);
            ContractEntity contract = new ContractEntity();
            contract.setRoom(room);
            contract.setTenant(em.getReference(UserEntity.class, tenantId));
            contract.setStartDate(start);
            contract.setEndDate(end);
            contract.setRentPrice(new BigDecimal(price));
            contract.setStatus(status);
            em.persist(contract);
            return contract.getId();
        });
    }

    MonthlyRevenueEntity currentRow() {
        return revenues.findByUser_IdAndYearAndMonth(ownerId, (short) month.getYear(),
                (byte) month.getMonthValue()).orElseThrow();
    }

    @Test
    void initializationUsesInclusiveDatesAndOnlyAcceptedContractsAndIsIdempotent() {
        contract(ContractStatus.APPROVED, month.atEndOfMonth(), month.plusMonths(1).atEndOfMonth(), "100");
        contract(ContractStatus.TERMINATED, month.minusMonths(1).atDay(1), month.atDay(1), "200");
        contract(ContractStatus.EXPIRED, month.atDay(1), month.atDay(1), "300");
        contract(ContractStatus.PENDING, month.atDay(1), month.atEndOfMonth(), "400");
        contract(ContractStatus.CANCELLED, month.atDay(1), month.atEndOfMonth(), "500");
        contract(ContractStatus.APPROVED, month.plusMonths(1).atDay(1), month.plusMonths(2).atDay(1), "600");
        contract(ContractStatus.TERMINATED, month.minusMonths(1).atDay(1), month.atDay(1).minusDays(1), "700");
        revenueService.initializeOwnerMonth(ownerId, month);
        revenueService.initializeOwnerMonth(ownerId, month);
        assertEquals(new BigDecimal("600.00"), currentRow().getRevenue());
        assertEquals(new BigDecimal("570.00"), currentRow().getProfit());
        assertEquals(1, revenues.findAllByUser_IdOrderByYearDescMonthDesc(ownerId).size());
    }

    @Test
    void simultaneousApprovalsAndInitializationCountEachContractOnce() throws Exception {
        contract(ContractStatus.APPROVED, month.atDay(1), month.atEndOfMonth(), "50");
        Long first = contract(ContractStatus.PENDING, month.atDay(1), month.plusMonths(1).atEndOfMonth(), "100");
        Long second = contract(ContractStatus.PENDING, month.atDay(1), month.plusMonths(1).atEndOfMonth(), "200");
        CountDownLatch ready = new CountDownLatch(3);
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(3)) {
            List<Callable<Void>> actions = List.of(
                    () -> { contractService.processRentalRequest(first, ContractStatus.APPROVED, null); return null; },
                    () -> { contractService.processRentalRequest(second, ContractStatus.APPROVED, null); return null; },
                    () -> { revenueService.initializeOwnerMonth(ownerId, month); return null; });
            List<Future<Void>> futures = actions.stream().map(action -> executor.submit((Callable<Void>) () -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Start timed out");
                return action.call();
            })).toList();
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            for (Future<Void> future : futures) future.get(20, TimeUnit.SECONDS);
        }
        assertEquals(new BigDecimal("350.00"), currentRow().getRevenue());
        assertEquals(new BigDecimal("332.50"), currentRow().getProfit());
        assertEquals(1, revenues.findAllByUser_IdOrderByYearDescMonthDesc(ownerId).size());
        assertThrows(ConflictException.class,
                () -> contractService.processRentalRequest(first, ContractStatus.APPROVED, null));
        assertEquals(new BigDecimal("350.00"), currentRow().getRevenue());
    }

    @Test
    void approvalInitializesOnceAndTerminationKeepsCurrentMonthRevenue() {
        contract(ContractStatus.APPROVED, month.atDay(1), month.plusMonths(2).atEndOfMonth(), "50");
        Long first = contract(ContractStatus.PENDING, month.atDay(1), month.plusMonths(2).atEndOfMonth(), "100");
        contractService.processRentalRequest(first, ContractStatus.APPROVED, null);
        assertEquals(new BigDecimal("150.00"), currentRow().getRevenue());
        Long second = contract(ContractStatus.PENDING, month.atDay(1), month.plusMonths(2).atEndOfMonth(), "200");
        contractService.processRentalRequest(second, ContractStatus.APPROVED, null);
        assertEquals(new BigDecimal("350.00"), currentRow().getRevenue());
        when(currentUser.hasAuthority("ROLE_OWNER")).thenReturn(true);
        contractService.terminateContract(first);
        assertEquals(new BigDecimal("350.00"), currentRow().getRevenue());
        assertEquals(new BigDecimal("250.00"), revenueService.initializeOwnerMonth(ownerId, month.plusMonths(1)).revenue());
    }

    @Test
    void notificationFailureRollsBackApprovalAndNewRevenueTogether() {
        Long id = contract(ContractStatus.PENDING, month.atDay(1), month.plusMonths(1).atEndOfMonth(), "100");
        when(notifications.createNotification(anyLong(), any())).thenThrow(new IllegalStateException("Test failure"));
        assertThrows(IllegalStateException.class,
                () -> contractService.processRentalRequest(id, ContractStatus.APPROVED, null));
        assertEquals(ContractStatus.PENDING, contracts.findById(id).orElseThrow().getStatus());
        assertTrue(revenues.findAllByUser_IdOrderByYearDescMonthDesc(ownerId).isEmpty());
    }

    @Test
    void adminHistoryUsesSavedOwnerProfitsInsteadOfCurrentCommission() {
        transaction.executeWithoutResult(tx -> {
            for (String rate : List.of("5", "7")) {
                MonthlyRevenueEntity row = new MonthlyRevenueEntity();
                row.setUser(user(UserRole.OWNER));
                row.setYear((short) 2001);
                row.setMonth((byte) 1);
                row.setRevenue(new BigDecimal("1000.00"));
                row.setCommissionPercent(new BigDecimal(rate));
                em.persist(row);
            }
        });
        var result = revenueService.getAdminHistory().stream()
                .filter(row -> row.year() == 2001 && row.month() == 1)
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("2000.00"), result.revenue());
        assertEquals(new BigDecimal("120.00"), result.profit());
    }

    @Test
    void adminAggregatesSavedOwnerRowsAndMissingListIncludesOwnersWithoutContracts() {
        contract(ContractStatus.APPROVED, month.atDay(1), month.atEndOfMonth(), "100");
        revenueService.initializeOwnerMonth(ownerId, month);
        Long emptyOwner = transaction.execute(tx -> user(UserRole.OWNER).getId());
        assertTrue(revenueService.getOwnersMissingRevenue().stream().anyMatch(u -> u.id().equals(emptyOwner)));
        assertFalse(revenueService.getOwnersMissingRevenue().stream().anyMatch(u -> u.id().equals(ownerId)));
        BigDecimal total = revenueService.getAdminCurrentRevenue().revenue();
        assertEquals(total.multiply(new BigDecimal("0.05")).setScale(2), revenueService.getAdminCurrentRevenue().profit());
        assertTrue(revenueService.getAdminHistory().stream().anyMatch(row ->
                row.year() == month.getYear() && row.month() == month.getMonthValue()
                        && row.revenue().compareTo(total) == 0));
        assertEquals(new BigDecimal("0.00"), revenueService.initializeOwnerMonth(emptyOwner, month).profit());
    }
}
