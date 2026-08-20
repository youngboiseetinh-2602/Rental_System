package com.javaweb.service.impl;

import com.javaweb.converter.RentalPropertyConverter;
import com.javaweb.converter.ContractConverter;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.entity.ContractEntity;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.model.response.ContractResponse;
import com.javaweb.model.response.RentalPropertyResponse;
import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.OwnerService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerServiceImpl implements OwnerService {

    private final RentalPropertyRepository rentalPropertyRepository;
    private final ContractRepository contractRepository;
    private final RentalPropertyConverter rentalPropertyConverter;
    private final ContractConverter contractConverter;
    private final CurrentUserContext currentUserContext;

    @Override
    @PreAuthorize(AuthorizationRules.OWNER)
    @Transactional(readOnly = true)
    public List<RentalPropertyResponse> getOwnerRentals() {
        Long ownerId = currentUserContext.getCurrentUserId();
        List<RentalPropertyEntity> rentalPropertyEntities =
                rentalPropertyRepository.findByOwnerId(ownerId);
        if (rentalPropertyEntities.isEmpty()) {
            throw new DataNotFoundException("Chủ trọ chưa có nhà trọ");
        }
        List<RentalPropertyResponse> results = new ArrayList<>();
        for (RentalPropertyEntity rentalPropertyEntity : rentalPropertyEntities) {
            results.add(rentalPropertyConverter.toRentalPropertyResponse(
                    rentalPropertyEntity));
        }

        return results;
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER)
    @Transactional
    public List<ContractResponse> getOwnerRentalRequests() {
        Long ownerId = currentUserContext.getCurrentUserId();
        List<ContractEntity> contractEntities =
                contractRepository.findAllByRoom_RoomType_RentalProperty_Owner_Id(
                        ownerId);

        if (contractEntities.isEmpty()) {
            throw new DataNotFoundException("Không tìm thấy yêu cầu thuê trọ nào");
        }

        List<ContractResponse> results = new ArrayList<>();

        for (ContractEntity contractEntity : contractEntities) {
            results.add(contractConverter.toContractResponse(contractEntity));
        }

        return results;
    }

}
