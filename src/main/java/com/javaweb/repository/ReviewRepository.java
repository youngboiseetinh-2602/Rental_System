package com.javaweb.repository;

import com.javaweb.entity.RentalTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<RentalTypeEntity, Long> {
}
