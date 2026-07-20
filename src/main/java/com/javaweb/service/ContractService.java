package com.javaweb.service;

import com.javaweb.model.request.RentalRequest;
import com.javaweb.enums.ContractStatus;
import com.javaweb.model.response.ContractResponse;
import java.util.List;

public interface ContractService {

    String createRentalRequest(RentalRequest request);

    String processRentalRequest(Long contractId, ContractStatus status);

    String cancelRentalRequest(Long contractId);

    String terminateContract(Long contractId);

    List<ContractResponse> getUserRentalRequests();

    void notifyContractsExpiringInOneWeek();

    void expireContracts();
}
