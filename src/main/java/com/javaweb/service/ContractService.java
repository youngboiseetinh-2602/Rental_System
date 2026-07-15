package com.javaweb.service;

import com.javaweb.model.request.RentalRequest;
import com.javaweb.enums.ContractStatus;
import com.javaweb.model.response.RentalRequestResponse;
import java.util.List;

public interface ContractService {

    String createRentalRequest(Long userId, RentalRequest request);

    String processRentalRequest(Long contractId, ContractStatus status);

    String cancelRentalRequest(Long userId, Long contractId);

    List<RentalRequestResponse> getUserRentalRequests(Long userId);

    void notifyContractsExpiringInOneWeek();
}
