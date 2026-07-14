package com.javaweb.service;

import com.javaweb.model.request.CreateRentalProperty;
import com.javaweb.model.request.UpdateRentalProperty;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalDetail;
import java.util.List;

public interface RentalPropertyService {

    List<Rental> getRentalProperties();

    RentalDetail getRentalPropertyDetail(Long rentalPropertyId);

    String createRentalProperty(Long ownerId, CreateRentalProperty request);

    String updateRentalProperty(Long rentalPropertyId, UpdateRentalProperty request);

    String deleteRentalProperty(Long rentalPropertyId);

    String addRentalPropertyImages(Long rentalPropertyId, List<String> imageUrls);

}
