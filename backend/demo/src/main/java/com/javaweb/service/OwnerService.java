package com.javaweb.service;

import com.javaweb.model.response.ContractResponse;
import com.javaweb.model.response.RentalPropertyResponse;
import java.util.List;

public interface OwnerService {

    List<RentalPropertyResponse> getOwnerRentals();

    List<ContractResponse> getOwnerRentalRequests();
}
