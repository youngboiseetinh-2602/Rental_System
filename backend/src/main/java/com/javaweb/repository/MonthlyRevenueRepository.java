package com.javaweb.repository;

import com.javaweb.entity.MonthlyRevenueEntity;
import com.javaweb.enums.UserRole;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonthlyRevenueRepository extends JpaRepository<MonthlyRevenueEntity, Long> {
    List<MonthlyRevenueEntity> findAllByYearAndMonthAndUser_Role(
            Short year, Byte month, UserRole role);
}
