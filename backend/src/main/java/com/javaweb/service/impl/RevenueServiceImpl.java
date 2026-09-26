// /new/ - File moi cho thong ke doanh thu.
package com.javaweb.service.impl;

import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.entity.ContractEntity;
import com.javaweb.entity.MonthlyRevenueEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ContractStatus;
import com.javaweb.enums.UserRole;
import com.javaweb.model.response.RevenueResponse;
import com.javaweb.model.response.OwnerRevenueStatusResponse;
import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.MonthlyRevenueRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.RevenueService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RevenueServiceImpl implements RevenueService {
    private static final BigDecimal COMMISSION = new BigDecimal("5.00");
    private static final List<ContractStatus> COUNTED_STATUSES = List.of(
            ContractStatus.APPROVED, ContractStatus.TERMINATED, ContractStatus.EXPIRED);
    private final MonthlyRevenueRepository revenueRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final CurrentUserContext currentUserContext;
    private final Clock revenueClock;

    @Override
    @PreAuthorize(AuthorizationRules.OWNER)
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public RevenueResponse getOwnerCurrentRevenue() {
        return initializeOwnerMonth(currentUserContext.getCurrentUserId(), YearMonth.now(revenueClock));
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public RevenueResponse initializeOwnerMonth(Long ownerId, YearMonth month) {
        UserEntity owner = lockOwner(ownerId);
        MonthlyRevenueEntity revenue = revenueRepository.findByUser_IdAndYearAndMonth(
                ownerId, (short) month.getYear(), (byte) month.getMonthValue())
                .orElseGet(() -> createMonth(owner, month));
        return response(revenue);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void addApprovedContract(ContractEntity contract) {
        YearMonth month = YearMonth.now(revenueClock);
        if (contract.getStatus() != ContractStatus.APPROVED
                || contract.getStartDate().isAfter(month.atEndOfMonth())
                || contract.getEndDate() == null
                || contract.getEndDate().isBefore(month.atDay(1))) {
            return;
        }
        UserEntity owner = lockOwner(contract.getRoom().getRoomType().getRentalProperty().getOwner().getId());
        MonthlyRevenueEntity revenue = revenueRepository.findByUser_IdAndYearAndMonth(
                owner.getId(), (short) month.getYear(), (byte) month.getMonthValue()).orElse(null);
        if (revenue == null) {
            // Flush APPROVED before SUM. The new contract is already included: do not add it twice.
            contractRepository.flush();
            createMonth(owner, month);
        } else {
            revenue.setRevenue(revenue.getRevenue().add(contract.getRentPrice()));
            revenue.setCommissionPercent(COMMISSION);
            revenue.calculateProfit();
            revenueRepository.save(revenue);
        }
    }

    private UserEntity lockOwner(Long ownerId) {
        UserEntity owner = userRepository.findByIdForRevenueUpdate(ownerId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy chủ trọ: " + ownerId));
        if (owner.getRole() != UserRole.OWNER) {
            throw new ForbiddenException("Tài khoản không phải chủ trọ");
        }
        return owner;
    }

    private MonthlyRevenueEntity createMonth(UserEntity owner, YearMonth month) {
        MonthlyRevenueEntity revenue = new MonthlyRevenueEntity();
        revenue.setUser(owner);
        revenue.setYear((short) month.getYear());
        revenue.setMonth((byte) month.getMonthValue());
        revenue.setRevenue(contractRepository.sumRevenueForMonth(
                owner.getId(), month.atDay(1), month.atEndOfMonth(), COUNTED_STATUSES));
        revenue.setCommissionPercent(COMMISSION);
        revenue.calculateProfit();
        return revenueRepository.save(revenue);
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER)
    @Transactional(readOnly = true)
    public List<RevenueResponse> getOwnerHistory() {
        return revenueRepository.findAllByUser_IdOrderByYearDescMonthDesc(currentUserContext.getCurrentUserId())
                .stream().map(this::response).toList();
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional(readOnly = true)
    public RevenueResponse getAdminCurrentRevenue() {
        YearMonth month = YearMonth.now(revenueClock);
        short year = (short) month.getYear();
        byte monthNumber = (byte) month.getMonthValue();
        return adminResponse(year, monthNumber, revenueRepository.sumOwnerRevenue(year, monthNumber));
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional(readOnly = true)
    public List<RevenueResponse> getAdminHistory() {
        return revenueRepository.aggregateOwnerHistory().stream()
                .map(row -> new RevenueResponse(row.getYear(), row.getMonth(), row.getRevenue(),
                        row.getRevenue().subtract(row.getOwnerProfit()))).toList();
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional(readOnly = true)
    public List<OwnerRevenueStatusResponse> getOwnersMissingRevenue() {
        YearMonth month = YearMonth.now(revenueClock);
        return userRepository.findOwnersMissingRevenue((short) month.getYear(), (byte) month.getMonthValue())
                .stream().map(owner -> new OwnerRevenueStatusResponse(
                        owner.getId(), owner.getFullName(), owner.getUsername())).toList();
    }

    private RevenueResponse response(MonthlyRevenueEntity revenue) {
        return new RevenueResponse(revenue.getYear(), revenue.getMonth(), revenue.getRevenue(), revenue.getProfit());
    }

    private RevenueResponse adminResponse(Short year, Byte month, BigDecimal revenue) {
        return new RevenueResponse(year, month, revenue,
                revenue.multiply(COMMISSION.movePointLeft(2)).setScale(2, RoundingMode.HALF_UP));
    }
}
