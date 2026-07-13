package com.javaweb.service.impl;

import com.javaweb.customException.DataNotFoundException;
import com.javaweb.entity.FacilityEntity;
import com.javaweb.entity.ImageEntity;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RentalTypeEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.RoomTypeEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.model.request.CreateRentalProperty;
import com.javaweb.model.request.CreateRoom;
import com.javaweb.model.request.CreateRoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.UpdateRentalProperty;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalDetail;
import com.javaweb.repository.FacilityRepository;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.repository.RentalTypeRepository;
import com.javaweb.repository.RoomRepository;
import com.javaweb.repository.RoomTypeRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.service.OwnerService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerServiceImpl implements OwnerService {

    private final UserRepository userRepository;
    private final RentalTypeRepository rentalTypeRepository;
    private final RentalPropertyRepository rentalPropertyRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final FacilityRepository facilityRepository;
    private final RoomRepository roomRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional(readOnly = true)
    public List<Rental> getRentalProperties() {
        return rentalPropertyRepository.findAll().stream()
                .map(this::toRental)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RentalDetail getRentalPropertyDetail(Long rentalPropertyId) {
        RentalPropertyEntity rentalProperty = getRentalPropertyById(rentalPropertyId);
        return toRentalDetail(rentalProperty);
    }

    @Override
    @Transactional
    public String createRentalProperty(Long ownerId, CreateRentalProperty request) {
        UserEntity owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new DataNotFoundException("Owner not found with id: " + ownerId));
        RentalTypeEntity rentalType = getOrCreateRentalType(request.getRentalTypeName());
        RentalPropertyEntity rentalProperty = buildRentalProperty(request, owner, rentalType);

        rentalPropertyRepository.save(rentalProperty);
        return "tao nha tro thanh cong";
    }

    @Override
    @Transactional
    public String updateRentalProperty(Long rentalPropertyId, UpdateRentalProperty request) {
        RentalPropertyEntity rentalProperty = getRentalPropertyById(rentalPropertyId);
        RentalTypeEntity rentalType = getOrCreateRentalType(request.getRentalTypeName());

        modelMapper.map(request, rentalProperty);
        rentalProperty.setRentalType(rentalType);

        rentalPropertyRepository.save(rentalProperty);
        return "cap nhat nha tro thanh cong";
    }

    @Override
    @Transactional
    public String deleteRentalProperty(Long rentalPropertyId) {
        RentalPropertyEntity rentalProperty = getRentalPropertyById(rentalPropertyId);

        if (hasRoomsWithContracts(rentalProperty)) {
            throw new IllegalArgumentException("Cannot delete rental property because it has rooms with contracts");
        }

        if (!rentalProperty.getReviews().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete rental property because it has reviews");
        }

        if (!rentalProperty.getNotificationDetails().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete rental property because it has notification details");
        }

        rentalPropertyRepository.delete(rentalProperty);
        return "xoa nha tro thanh cong";
    }

    @Override
    @Transactional
    public String addRentalPropertyImages(Long rentalPropertyId, List<String> imageUrls) {
        RentalPropertyEntity rentalProperty = getRentalPropertyById(rentalPropertyId);
        rentalProperty.getImages().addAll(toImages(imageUrls, rentalProperty));

        rentalPropertyRepository.save(rentalProperty);
        return "them anh nha tro thanh cong";
    }

    @Override
    @Transactional
    public String addRoomType(Long rentalPropertyId, CreateRoomType request) {
        RentalPropertyEntity rentalProperty = getRentalPropertyById(rentalPropertyId);
        RoomTypeEntity roomType = toRoomType(request, rentalProperty);

        roomTypeRepository.save(roomType);
        return "them loai phong thanh cong";
    }

    @Override
    @Transactional
    public String deleteRoomType(Long roomTypeId) {
        RoomTypeEntity roomType = getRoomTypeById(roomTypeId);

        if (!roomType.getRooms().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete room type because it still has rooms");
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
    public String addRoom(Long roomTypeId, CreateRoom request) {
        RoomTypeEntity roomType = getRoomTypeById(roomTypeId);
        RoomEntity room = modelMapper.map(request, RoomEntity.class);
        room.setRoomType(roomType);

        roomRepository.save(room);
        return "them phong thanh cong";
    }

    @Override
    @Transactional
    public String deleteRoom(Long roomId) {
        RoomEntity room = getRoomById(roomId);

        if (!room.getContracts().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete room because it still has contracts");
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

    private Rental toRental(RentalPropertyEntity rentalProperty) {
        Rental rental = modelMapper.map(rentalProperty, Rental.class);
        setRentalExtraInfo(rentalProperty, rental);
        return rental;
    }

    private RentalDetail toRentalDetail(RentalPropertyEntity rentalProperty) {
        RentalDetail rentalDetail = modelMapper.map(rentalProperty, RentalDetail.class);
        setRentalExtraInfo(rentalProperty, rentalDetail);
        return rentalDetail;
    }

    private boolean hasRoomsWithContracts(RentalPropertyEntity rentalProperty) {
        return rentalProperty.getRoomTypes().stream()
                .flatMap(roomType -> roomType.getRooms().stream())
                .anyMatch(room -> !room.getContracts().isEmpty());
    }

    private void setRentalExtraInfo(RentalPropertyEntity rentalProperty, Rental rental) {
        UserEntity owner = rentalProperty.getOwner();
        rental.setOwnerId(owner.getId());
        rental.setOwnerName(owner.getFullName());
        rental.setOwnerPhoneNumber(owner.getPhoneNumber());
        rental.setOwnerAvatarUrl(owner.getAvatarUrl());

        RentalTypeEntity rentalType = rentalProperty.getRentalType();
        rental.setRentalTypeId(rentalType.getId());
        rental.setRentalTypeName(rentalType.getName());
        rental.setRentalTypeDescription(rentalType.getDescription());
    }

    private RentalTypeEntity getOrCreateRentalType(String rentalTypeName) {
        String normalizedName = rentalTypeName.trim();
        return rentalTypeRepository.findFirstByNameIgnoreCase(normalizedName)
                .orElseGet(() -> {
                    RentalTypeEntity rentalType = new RentalTypeEntity();
                    rentalType.setName(normalizedName);
                    return rentalTypeRepository.save(rentalType);
                });
    }

    private RentalPropertyEntity buildRentalProperty(
            CreateRentalProperty request,
            UserEntity owner,
            RentalTypeEntity rentalType
    ) {
        RentalPropertyEntity rentalProperty = modelMapper.map(request, RentalPropertyEntity.class);
        rentalProperty.setOwner(owner);
        rentalProperty.setRentalType(rentalType);
        rentalProperty.setImages(toImages(request.getImageUrls(), rentalProperty));
        rentalProperty.setRoomTypes(toRoomTypes(request.getRoomTypes(), rentalProperty));
        return rentalProperty;
    }

    private List<ImageEntity> toImages(List<String> imageUrls, RentalPropertyEntity rentalProperty) {
        return imageUrls.stream()
                .map(imageUrl -> {
                    ImageEntity image = new ImageEntity();
                    image.setRentalProperty(rentalProperty);
                    image.setImageUrl(imageUrl);
                    return image;
                })
                .toList();
    }

    private List<RoomTypeEntity> toRoomTypes(
            List<CreateRoomType> requests,
            RentalPropertyEntity rentalProperty
    ) {
        return requests.stream()
                .map(request -> toRoomType(request, rentalProperty))
                .toList();
    }

    private RoomTypeEntity toRoomType(CreateRoomType request, RentalPropertyEntity rentalProperty) {
        RoomTypeEntity roomType = modelMapper.map(request, RoomTypeEntity.class);
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

    private List<RoomEntity> toRooms(List<CreateRoom> requests, RoomTypeEntity roomType) {
        return requests.stream()
                .map(request -> {
                    RoomEntity room = modelMapper.map(request, RoomEntity.class);
                    room.setRoomType(roomType);
                    return room;
                })
                .toList();
    }
}
