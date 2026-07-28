package com.javaweb.converter;

import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RentalTypeEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.model.response.RentalPropertyDetailResponse;
import com.javaweb.model.response.RentalPropertyResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RentalPropertyConverter {

    private final ModelMapper modelMapper;

    public RentalPropertyResponse toRentalPropertyResponse(RentalPropertyEntity rentalProperty) {
        RentalPropertyResponse response = modelMapper.map(rentalProperty, RentalPropertyResponse.class);
        setExtraInfo(rentalProperty, response);
        return response;
    }

    public RentalPropertyDetailResponse toRentalPropertyDetailResponse(RentalPropertyEntity rentalProperty) {
        RentalPropertyDetailResponse response = modelMapper.map(
                rentalProperty,
                RentalPropertyDetailResponse.class);
        setExtraInfo(rentalProperty, response);
        return response;
    }

    private void setExtraInfo(RentalPropertyEntity rentalProperty, RentalPropertyResponse response) {
        UserEntity owner = rentalProperty.getOwner();
        response.setOwnerName(owner.getFullName());
        response.setOwnerPhoneNumber(owner.getPhoneNumber());
        response.setOwnerAvatarUrl(owner.getAvatarUrl());

        RentalTypeEntity rentalType = rentalProperty.getRentalType();
        response.setRentalTypeName(rentalType.getName());
        response.setRentalTypeDescription(rentalType.getDescription());
    }
}
