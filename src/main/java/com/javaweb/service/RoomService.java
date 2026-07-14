package com.javaweb.service;

import com.javaweb.model.request.CreateRoom;
import com.javaweb.model.request.CreateRoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.UpdateRoomType;

public interface RoomService {

    String addRoomType(Long rentalPropertyId, CreateRoomType request);

    String updateRoomType(Long roomTypeId, UpdateRoomType request);

    String deleteRoomType(Long roomTypeId);

    String addFacility(Long roomTypeId, FacilityInfo request);

    String updateFacility(Long facilityId, FacilityInfo request);

    String deleteFacility(Long facilityId);

    String addRoom(Long roomTypeId, CreateRoom request);

    String deleteRoom(Long roomId);
}
