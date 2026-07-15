package com.javaweb.converter;

import com.javaweb.entity.ContractEntity;
import com.javaweb.model.response.RentalRequestResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ContractConverter {

    private final ModelMapper modelMapper;

    public RentalRequestResponse toRentalRequestResponse(ContractEntity contract) {
        RentalRequestResponse response = modelMapper.map(
                contract, RentalRequestResponse.class);
        response.setRoomId(contract.getRoom().getId());
        response.setRoomName(contract.getRoom().getName());
        response.setTenantId(contract.getTenant().getId());
        response.setTenantName(contract.getTenant().getFullName());
        return response;
    }
}
