package com.javaweb.service;

import com.javaweb.model.request.Room;
import com.javaweb.model.request.RoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.UpdateRoomType;
import java.util.List;

public interface RoomService {

    String addRoomType(Long rentalPropertyId, RoomType request);

    String updateRoomType(Long roomTypeId, UpdateRoomType request);

    String deleteRoomType(Long roomTypeId);

    String addFacilities(Long roomTypeId, List<FacilityInfo> requests);

    String updateFacility(Long facilityId, FacilityInfo request);

    String deleteFacility(Long facilityId);

    String addRooms(Long roomTypeId, List<Room> requests);

    String deleteRoom(Long roomId);
}
