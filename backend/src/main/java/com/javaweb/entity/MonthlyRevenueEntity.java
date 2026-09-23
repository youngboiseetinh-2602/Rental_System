package com.javaweb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "monthlyRevenue", uniqueConstraints =
        @UniqueConstraint(name = "uk_monthly_revenue_user_month", columnNames = {"user_id", "year", "month"}))
public class MonthlyRevenueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private Short year;

    @Column(nullable = false)
    private Byte month;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal revenue = BigDecimal.ZERO;

    @Column(name = "commissionPercent", nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionPercent = BigDecimal.ZERO;

    @Setter(AccessLevel.NONE)
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal profit = BigDecimal.ZERO;

    @PrePersist
    @PreUpdate
    public void calculateProfit() {
        if (revenue == null || commissionPercent == null) {
            throw new IllegalStateException("Revenue and commission percent are required");
        }
        if (revenue.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Revenue cannot be negative");
        }
        if (commissionPercent.compareTo(BigDecimal.ZERO) < 0
                || commissionPercent.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("Commission percent must be between 0 and 100");
        }
        profit = revenue.multiply(BigDecimal.ONE.subtract(commissionPercent.movePointLeft(2)))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
