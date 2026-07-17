package com.javaweb.service.impl;

import com.javaweb.customException.ConflictException;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.entity.FacilityEntity;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.RoomTypeEntity;
import com.javaweb.model.request.Room;
import com.javaweb.model.request.RoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.UpdateRoomType;
import com.javaweb.repository.FacilityRepository;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.repository.RoomRepository;
import com.javaweb.repository.RoomTypeRepository;
import com.javaweb.service.RoomService;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RentalPropertyRepository rentalPropertyRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final FacilityRepository facilityRepository;
    private final RoomRepository roomRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public String addRoomType(Long rentalPropertyId, RoomType request) {
        RentalPropertyEntity rentalProperty = getRentalPropertyById(rentalPropertyId);
        RoomTypeEntity roomType = toRoomType(request, rentalProperty);

        roomTypeRepository.save(roomType);
        return "them loai phong thanh cong";
    }

    @Override
    @Transactional
    public String updateRoomType(Long roomTypeId, UpdateRoomType request) {
        RoomTypeEntity roomType = getRoomTypeById(roomTypeId);
        String normalizedName = request.getName().trim().toLowerCase(java.util.Locale.ROOT);
        Long rentalPropertyId = roomType.getRentalProperty().getId();

        if (roomTypeRepository.existsByRentalProperty_IdAndNameIgnoreCaseAndIdNot(
                rentalPropertyId,
                normalizedName,
                roomTypeId
        )) {
            throw new ConflictException("Room type name already exists in this rental property");
        }

        modelMapper.map(request, roomType);
        roomType.setName(normalizedName);
        roomTypeRepository.save(roomType);
        return "cap nhat loai phong thanh cong";
    }

    @Override
    @Transactional
    public String deleteRoomType(Long roomTypeId) {
        RoomTypeEntity roomType = getRoomTypeById(roomTypeId);

        boolean hasCurrentTenant = roomType.getRooms().stream()
                .anyMatch(room -> room.getCurrentTenant() != null);
        if (hasCurrentTenant) {
            throw new IllegalArgumentException(
                    "Cannot delete room type because one or more rooms are occupied");
        }

        roomTypeRepository.delete(roomType);
        return "xoa loai phong thanh cong";
    }

    @Override
    @Transactional
    public String addFacility(Long roomTypeId, FacilityInfo request) {
        RoomTypeEntity roomType = getRoomTypeById(roomTypeId);
        FacilityEntity facility = modelMapper.map(request, FacilityEntity.class);
        facility.setRoomType(roomType);

        facilityRepository.save(facility);
        return "them co so vat chat thanh cong";
    }

    @Override
    @Transactional
    public String updateFacility(Long facilityId, FacilityInfo request) {
        FacilityEntity facility = getFacilityById(facilityId);

        modelMapper.map(request, facility);
        facilityRepository.save(facility);
        return "cap nhat co so vat chat thanh cong";
    }

    @Override
    @Transactional
    public String deleteFacility(Long facilityId) {
        FacilityEntity facility = getFacilityById(facilityId);

        facilityRepository.delete(facility);
        return "xoa co so vat chat thanh cong";
    }

    @Override
    @Transactional
    public String addRooms(Long roomTypeId, List<Room> requests) {
        RoomTypeEntity roomType = getRoomTypeById(roomTypeId);
        Long rentalPropertyId = roomType.getRentalProperty().getId();
        Set<String> roomNames = new HashSet<>();
        List<RoomEntity> rooms = requests.stream()
                .map(request -> {
                    String normalizedRoomName = request.getName().trim();
                    String comparisonName = normalizedRoomName.toLowerCase(Locale.ROOT);

                    if (!roomNames.add(comparisonName)
                            || roomRepository.existsByRoomType_RentalProperty_IdAndNameIgnoreCase(
                                    rentalPropertyId,
                                    normalizedRoomName)) {
                        throw new ConflictException(
                                "Room name already exists in this rental property: " + normalizedRoomName);
                    }

                    RoomEntity room = modelMapper.map(request, RoomEntity.class);
                    room.setName(normalizedRoomName);
                    room.setRoomType(roomType);
                    return room;
                })
                .toList();

        roomRepository.saveAll(rooms);
        return "them danh sach phong thanh cong";
    }

    @Override
    @Transactional
    public String deleteRoom(Long roomId) {
        RoomEntity room = getRoomById(roomId);

        if (room.getCurrentTenant() != null) {
            throw new IllegalArgumentException("Cannot delete room because it is currently rented");
        }

        roomRepository.delete(room);
        return "xoa phong thanh cong";
    }

    private RentalPropertyEntity getRentalPropertyById(Long rentalPropertyId) {
        return rentalPropertyRepository.findById(rentalPropertyId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Rental property not found with id: " + rentalPropertyId));
    }

    private RoomTypeEntity getRoomTypeById(Long roomTypeId) {
        return roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new DataNotFoundException("Room type not found with id: " + roomTypeId));
    }

    private FacilityEntity getFacilityById(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new DataNotFoundException("Facility not found with id: " + facilityId));
    }

    private RoomEntity getRoomById(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new DataNotFoundException("Room not found with id: " + roomId));
    }

    private RoomTypeEntity toRoomType(RoomType request, RentalPropertyEntity rentalProperty) {
        RoomTypeEntity roomType = modelMapper.map(request, RoomTypeEntity.class);
        roomType.setName(request.getName().trim().toLowerCase(java.util.Locale.ROOT));
        roomType.setRentalProperty(rentalProperty);
        roomType.setFacilities(toFacilities(request.getFacilities(), roomType));
        roomType.setRooms(toRooms(request.getRooms(), roomType));
        return roomType;
    }

    private List<FacilityEntity> toFacilities(List<FacilityInfo> requests, RoomTypeEntity roomType) {
        return requests.stream()
                .map(request -> {
                    FacilityEntity facility = modelMapper.map(request, FacilityEntity.class);
                    facility.setRoomType(roomType);
                    return facility;
                })
                .toList();
    }

    private List<RoomEntity> toRooms(List<Room> requests, RoomTypeEntity roomType) {
        return requests.stream()
                .map(request -> {
                    RoomEntity room = modelMapper.map(request, RoomEntity.class);
                    room.setRoomType(roomType);
                    return room;
                })
                .toList();
    }
}
