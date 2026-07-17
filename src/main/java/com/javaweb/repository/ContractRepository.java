package com.javaweb.repository;

import com.javaweb.entity.ContractEntity;
import com.javaweb.enums.ContractStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractRepository extends JpaRepository<ContractEntity, Long> {

        boolean existsByTenant_IdAndRoom_IdAndStatus(
                        Long tenantId,
                        Long roomId,
                        ContractStatus status);

        List<ContractEntity> findAllByRoom_IdAndStatus(Long roomId, ContractStatus status);

        List<ContractEntity> findAllByRoom_RoomType_RentalProperty_Owner_Id(Long ownerId);

        List<ContractEntity> findAllByTenant_Id(Long tenantId);

        List<ContractEntity> findAllByStatusAndEndDate(
                        ContractStatus status,
                        LocalDate endDate);

        List<ContractEntity> findAllByStatusAndEndDateBefore(
                        ContractStatus status,
                        LocalDate endDate);
}
