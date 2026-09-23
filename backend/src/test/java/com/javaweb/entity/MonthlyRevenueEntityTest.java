package com.javaweb.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class MonthlyRevenueEntityTest {

    @Test
    void calculatesProfitFromRevenueAndCommissionPercent() {
        MonthlyRevenueEntity monthlyRevenue = new MonthlyRevenueEntity();
        monthlyRevenue.setRevenue(new BigDecimal("1000000.00"));
        monthlyRevenue.setCommissionPercent(new BigDecimal("12.50"));

        monthlyRevenue.calculateProfit();

        assertEquals(new BigDecimal("875000.00"), monthlyRevenue.getProfit());
    }

    @Test
    void rejectsCommissionOutsidePercentRange() {
        MonthlyRevenueEntity monthlyRevenue = new MonthlyRevenueEntity();
        monthlyRevenue.setCommissionPercent(new BigDecimal("101"));

        assertThrows(IllegalArgumentException.class, monthlyRevenue::calculateProfit);
    }
}
