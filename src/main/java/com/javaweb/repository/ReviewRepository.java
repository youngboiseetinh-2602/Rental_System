package com.javaweb.repository;

import com.javaweb.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

    boolean existsByUserIdAndRentalPropertyId(Long userId, Long rentalPropertyId);
}
