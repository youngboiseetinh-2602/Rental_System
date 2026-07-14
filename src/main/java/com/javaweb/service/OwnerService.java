package com.javaweb.service;

import com.javaweb.model.request.CreateRentalProperty;
import com.javaweb.model.request.CreateRoom;
import com.javaweb.model.request.CreateRoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.UpdateRentalProperty;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalDetail;
import java.util.List;

public interface OwnerService {

    List<Rental> myRental(Long id);

    List<Rental> getRentalProperties();

    RentalDetail getRentalPropertyDetail(Long rentalPropertyId);

    String createRentalProperty(Long ownerId, CreateRentalProperty request);

    String updateRentalProperty(Long rentalPropertyId, UpdateRentalProperty request);

    String deleteRentalProperty(Long rentalPropertyId);

    String addRentalPropertyImages(Long rentalPropertyId, List<String> imageUrls);

    String addRoomType(Long rentalPropertyId, CreateRoomType request);

    String deleteRoomType(Long roomTypeId);

    String addFacility(Long roomTypeId, FacilityInfo request);

    String updateFacility(Long facilityId, FacilityInfo request);

    String deleteFacility(Long facilityId);

    String addRoom(Long roomTypeId, CreateRoom request);

    String deleteRoom(Long roomId);
}
