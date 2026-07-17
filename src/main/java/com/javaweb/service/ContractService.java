package com.javaweb.service;

import com.javaweb.model.request.RentalRequest;
import com.javaweb.enums.ContractStatus;
import com.javaweb.model.response.ContractResponse;
import java.util.List;

public interface ContractService {

    String createRentalRequest(Long userId, RentalRequest request);

    String processRentalRequest(Long contractId, ContractStatus status);

    String cancelRentalRequest(Long userId, Long contractId);

    List<ContractResponse> getUserRentalRequests(Long userId);

    void notifyContractsExpiringInOneWeek();

    void expireContracts();
}
