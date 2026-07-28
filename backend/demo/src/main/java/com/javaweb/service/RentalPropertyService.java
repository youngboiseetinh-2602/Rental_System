package com.javaweb.service;

import com.javaweb.model.request.RentalPropertyInfoRequest;
import com.javaweb.model.request.RentalPropertyRequest;
import com.javaweb.model.response.RentalPropertyDetailResponse;
import com.javaweb.model.response.RentalPropertyResponse;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RentalPropertyService {

    Page<RentalPropertyResponse> getRentalProperties(Pageable pageable);

    Page<RentalPropertyResponse> searchRentalProperties(Map<String, Object> params, Pageable pageable);

    RentalPropertyDetailResponse getRentalPropertyDetail(Long rentalPropertyId);

    String createRentalProperty(RentalPropertyRequest request);

    String updateRentalProperty(Long rentalPropertyId, RentalPropertyInfoRequest request);

    String deleteRentalProperty(Long rentalPropertyId);

    String addRentalPropertyImages(Long rentalPropertyId, List<String> imageUrls);

    String deleteRentalPropertyImage(Long imageId);
}
