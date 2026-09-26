// /new/ - File moi cho thong ke doanh thu.
package com.javaweb.service;

import com.javaweb.entity.ContractEntity;
import com.javaweb.model.response.RevenueResponse;
import com.javaweb.model.response.OwnerRevenueStatusResponse;
import java.time.YearMonth;
import java.util.List;

public interface RevenueService {
    RevenueResponse getOwnerCurrentRevenue();
    List<RevenueResponse> getOwnerHistory();
    RevenueResponse getAdminCurrentRevenue();
    List<RevenueResponse> getAdminHistory();
    List<OwnerRevenueStatusResponse> getOwnersMissingRevenue();
    RevenueResponse initializeOwnerMonth(Long ownerId, YearMonth month);
    void addApprovedContract(ContractEntity contract);
}
