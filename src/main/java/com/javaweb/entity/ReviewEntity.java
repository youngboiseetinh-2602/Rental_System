package com.javaweb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "review",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_review_rental_property",
                columnNames = {"userId", "rentalPropertyId"}))
@BatchSize(size = 50)
public class ReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rentalPropertyId", nullable = false)
    private RentalPropertyEntity rentalProperty;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
