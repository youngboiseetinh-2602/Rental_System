package com.javaweb.service;

import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalRequestResponse;
import java.util.List;

public interface OwnerService {

    List<Rental> getOwnerRentals(Long ownerId);

    List<RentalRequestResponse> getOwnerRentalRequests(Long ownerId);
}
