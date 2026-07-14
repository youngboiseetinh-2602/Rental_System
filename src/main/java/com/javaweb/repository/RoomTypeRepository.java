package com.javaweb.repository;

import com.javaweb.entity.RoomTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomTypeRepository extends JpaRepository<RoomTypeEntity, Long> {

    boolean existsByRentalProperty_IdAndNameIgnoreCaseAndIdNot(
            Long rentalPropertyId,
            String name,
            Long roomTypeId
    );
}
