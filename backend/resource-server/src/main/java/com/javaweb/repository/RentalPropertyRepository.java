package com.javaweb.repository;

import com.javaweb.entity.RentalPropertyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RentalPropertyRepository extends JpaRepository<RentalPropertyEntity, Long>,
        JpaSpecificationExecutor<RentalPropertyEntity> {
    List<RentalPropertyEntity> findByOwnerId(Long ownerId);
}
