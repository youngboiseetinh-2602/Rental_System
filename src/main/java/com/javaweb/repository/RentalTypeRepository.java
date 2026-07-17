package com.javaweb.repository;

import com.javaweb.entity.RentalTypeEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalTypeRepository extends JpaRepository<RentalTypeEntity, Long> {

    Optional<RentalTypeEntity> findFirstByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
