package com.javaweb.repository;

import com.javaweb.entity.RoomEntity;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomRepository extends JpaRepository<RoomEntity, Long> {

    boolean existsByRoomType_RentalProperty_IdAndNameIgnoreCase(Long rentalPropertyId, String name);

    @Query("""
            select room.id
            from RoomEntity room
            where room.roomType.id = :roomTypeId
            order by room.id
            """)
    List<Long> findIdsByRoomTypeId(@Param("roomTypeId") Long roomTypeId);

    @Query("""
            select room.id
            from RoomEntity room
            where room.roomType.rentalProperty.id = :rentalPropertyId
            order by room.id
            """)
    List<Long> findIdsByRentalPropertyId(
            @Param("rentalPropertyId") Long rentalPropertyId);

    // Khoa mot phong trong transaction de viec kiem tra va cap nhat khong bi chen ngang.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select room from RoomEntity room where room.id = :roomId")
    Optional<RoomEntity> findByIdForUpdate(@Param("roomId") Long roomId);
}
