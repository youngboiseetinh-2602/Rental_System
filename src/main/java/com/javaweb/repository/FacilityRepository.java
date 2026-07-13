package com.javaweb.repository;

import com.javaweb.entity.FacilityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<FacilityEntity, Long> {
}
