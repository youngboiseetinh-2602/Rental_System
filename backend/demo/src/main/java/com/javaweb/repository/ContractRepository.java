package com.javaweb.repository;

import com.javaweb.entity.ContractEntity;
import com.javaweb.enums.ContractStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContractRepository extends JpaRepository<ContractEntity, Long> {

        boolean existsByTenant_IdAndRoom_IdAndStatus(
                        Long tenantId,
                        Long roomId,
                        ContractStatus status);

        // Chi lay roomId de service co the khoa phong truoc khi load va khoa contract.
        @Query("select contract.room.id from ContractEntity contract where contract.id = :contractId")
        Optional<Long> findRoomIdByContractId(@Param("contractId") Long contractId);

        // Khoa mot yeu cau de tranh owner duyet trong luc customer dang huy.
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select contract from ContractEntity contract where contract.id = :contractId")
        Optional<ContractEntity> findByIdForUpdate(@Param("contractId") Long contractId);

        // Khoa cac yeu cau PENDING cua phong truoc khi chon mot yeu cau duoc duyet.
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("""
                        select contract
                        from ContractEntity contract
                        where contract.room.id = :roomId
                          and contract.status = :status
                        order by contract.id
                        """)
        List<ContractEntity> findAllByRoomIdAndStatusForUpdate(
                        @Param("roomId") Long roomId,
                        @Param("status") ContractStatus status);

        List<ContractEntity> findAllByRoom_RoomType_RentalProperty_Owner_Id(Long ownerId);

        List<ContractEntity> findAllByTenant_Id(Long tenantId);

        List<ContractEntity> findAllByStatusAndEndDate(
                        ContractStatus status,
                        LocalDate endDate);

        @Query("""
                        select contract.id
                        from ContractEntity contract
                        where contract.status = :status
                          and contract.endDate < :endDate
                        order by contract.room.id, contract.id
                        """)
        List<Long> findIdsByStatusAndEndDateBefore(
                        @Param("status") ContractStatus status,
                        @Param("endDate") LocalDate endDate);
}
