package com.javaweb.converter;

import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RentalTypeEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalDetail;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RentalConverter {

    private final ModelMapper modelMapper;

    public Rental toRental(RentalPropertyEntity rentalProperty) {
        Rental response = modelMapper.map(rentalProperty, Rental.class);
        setExtraInfo(rentalProperty, response);
        return response;
    }

    public RentalDetail toRentalDetail(RentalPropertyEntity rentalProperty) {
        RentalDetail response = modelMapper.map(rentalProperty, RentalDetail.class);
        setExtraInfo(rentalProperty, response);
        return response;
    }

    private void setExtraInfo(RentalPropertyEntity rentalProperty, Rental response) {
        UserEntity owner = rentalProperty.getOwner();
        response.setOwnerName(owner.getFullName());
        response.setOwnerPhoneNumber(owner.getPhoneNumber());
        response.setOwnerAvatarUrl(owner.getAvatarUrl());

        RentalTypeEntity rentalType = rentalProperty.getRentalType();
        response.setRentalTypeName(rentalType.getName());
        response.setRentalTypeDescription(rentalType.getDescription());
    }
}
