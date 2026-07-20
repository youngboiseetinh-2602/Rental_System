package com.javaweb.service;

import com.javaweb.model.response.Rental;
import com.javaweb.model.response.ContractResponse;
import java.util.List;

public interface OwnerService {

    List<Rental> getOwnerRentals();

    List<ContractResponse> getOwnerRentalRequests();
}
