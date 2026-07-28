package com.javaweb.service.impl;

import com.javaweb.converter.RentalPropertyConverter;
import com.javaweb.converter.ContractConverter;
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
        Long ownerId = getCurrentUserId();
        List<RentalPropertyEntity> rentalProperties = rentalPropertyRepository.findByOwnerId(ownerId);

        List<RentalPropertyResponse> responses = new ArrayList<>();

        for (RentalPropertyEntity rentalProperty : rentalProperties) {
            responses.add(rentalPropertyConverter.toRentalPropertyResponse(rentalProperty));
        }

        return responses;
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER)
    @Transactional(readOnly = true)
    public List<ContractResponse> getOwnerRentalRequests() {
        Long ownerId = getCurrentUserId();
        List<ContractEntity> requests =
                contractRepository.findAllByRoom_RoomType_RentalProperty_Owner_Id(
                        ownerId);

        List<ContractResponse> responses = new ArrayList<>();
        for (ContractEntity request : requests) {
            responses.add(contractConverter.toContractResponse(request));
        }
        return responses;
    }

    private Long getCurrentUserId() {
        return currentUserContext.getCurrentUserId();
    }
}
