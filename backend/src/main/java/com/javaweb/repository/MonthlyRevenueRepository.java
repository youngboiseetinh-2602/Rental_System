package com.javaweb.repository;

import com.javaweb.entity.MonthlyRevenueEntity;
import com.javaweb.enums.UserRole;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MonthlyRevenueRepository extends JpaRepository<MonthlyRevenueEntity, Long> {
    // /new/
    Optional<MonthlyRevenueEntity> findByUser_IdAndYearAndMonth(Long userId, Short year, Byte month);

    // /new/
    List<MonthlyRevenueEntity> findAllByUser_IdOrderByYearDescMonthDesc(Long userId);

    List<MonthlyRevenueEntity> findAllByYearAndMonthAndUser_Role(Short year, Byte month, UserRole role);

    // /new/
    @Query("select coalesce(sum(r.revenue), 0) from MonthlyRevenueEntity r "
            + "where r.user.role = com.javaweb.enums.UserRole.OWNER and r.year = :year and r.month = :month")
    BigDecimal sumOwnerRevenue(@Param("year") Short year, @Param("month") Byte month);

    // /new/
    interface MonthlyTotal {
        Short getYear();
        Byte getMonth();
        BigDecimal getRevenue();
        BigDecimal getOwnerProfit();
    }

    // /new/
    @Query("select r.year as year, r.month as month, sum(r.revenue) as revenue, sum(r.profit) as ownerProfit "
            + "from MonthlyRevenueEntity r where r.user.role = com.javaweb.enums.UserRole.OWNER "
            + "group by r.year, r.month order by r.year desc, r.month desc")
    List<MonthlyTotal> aggregateOwnerHistory();
}
