package com.javaweb.service.impl;

import com.javaweb.customException.DataNotFoundException;
import com.javaweb.converter.RentalConverter;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.model.response.Rental;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.service.OwnerService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerServiceImpl implements OwnerService {

    private final RentalPropertyRepository rentalPropertyRepository;
    private final RentalConverter rentalConverter;

    @Override
    @Transactional(readOnly = true)
    public List<Rental> getOwnerRentals(Long ownerId) {
        List<RentalPropertyEntity> rentalProperties = rentalPropertyRepository.findByOwnerId(ownerId);

        if (rentalProperties.isEmpty()) {
            throw new DataNotFoundException("khong tim thay du lieu");
        }

        List<Rental> responses = new ArrayList<>();

        for (RentalPropertyEntity rentalProperty : rentalProperties) {
            responses.add(rentalConverter.toRental(rentalProperty));
        }

        return responses;
    }
}
