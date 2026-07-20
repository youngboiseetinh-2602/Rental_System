package com.javaweb.service;

import com.javaweb.model.request.RentalProperty;
import com.javaweb.model.request.RentalPropertyInfo;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalDetail;
import java.util.List;
import java.util.Map;

public interface RentalPropertyService {

    List<Rental> getRentalProperties();

    List<Rental> searchRentalProperties(Map<String, Object> params);

    RentalDetail getRentalPropertyDetail(Long rentalPropertyId);

    String createRentalProperty(RentalProperty request);

    String updateRentalProperty(Long rentalPropertyId, RentalPropertyInfo request);

    String deleteRentalProperty(Long rentalPropertyId);

    String addRentalPropertyImages(Long rentalPropertyId, List<String> imageUrls);

    String deleteRentalPropertyImage(Long imageId);
}
