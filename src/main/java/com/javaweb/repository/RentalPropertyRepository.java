package com.javaweb.repository;

import com.javaweb.entity.RentalPropertyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalPropertyRepository extends JpaRepository<RentalPropertyEntity, Long> {
    List<RentalPropertyEntity> findByOwnerId(Long ownerId);
}
