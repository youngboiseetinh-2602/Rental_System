package com.javaweb.repository;

import com.javaweb.entity.RentalPropertyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalPropertyRepository extends JpaRepository<RentalPropertyEntity, Long> {
}
