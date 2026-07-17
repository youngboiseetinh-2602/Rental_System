package com.javaweb.service.impl;

import com.javaweb.builder.RentalSearchBuilder;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.converter.RentalConverter;
import com.javaweb.entity.FacilityEntity;
import com.javaweb.entity.ImageEntity;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RentalTypeEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.RoomTypeEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.model.request.RentalProperty;
import com.javaweb.model.request.Room;
import com.javaweb.model.request.RoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.RentalPropertyInfo;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalDetail;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.repository.ImageRepository;
import com.javaweb.repository.RentalTypeRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.service.RentalPropertyService;
import com.javaweb.specification.RentalPropertySpecification;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RentalPropertyServiceImpl implements RentalPropertyService {

    private final UserRepository userRepository;
    private final RentalTypeRepository rentalTypeRepository;
    private final RentalPropertyRepository rentalPropertyRepository;
    private final ImageRepository imageRepository;
    private final ModelMapper modelMapper;
    private final RentalConverter rentalConverter;

    @Override
    @Transactional(readOnly = true)
    public List<Rental> getRentalProperties() {
        List<RentalPropertyEntity> rentalProperties = rentalPropertyRepository.findAll();

        if (rentalProperties.isEmpty()) {
            throw new DataNotFoundException("khong tim thay du lieu");
        }

        List<Rental> responses = new ArrayList<>();

        for (RentalPropertyEntity rentalProperty : rentalProperties) {
            responses.add(rentalConverter.toRental(rentalProperty));
        }
        
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Rental> searchRentalProperties(RentalSearchBuilder searchBuilder) {
        List<RentalPropertyEntity> rentalProperties;

        if (searchBuilder == null || searchBuilder.isEmpty()) {
            rentalProperties = rentalPropertyRepository.findAll();
        } else {
            rentalProperties = rentalPropertyRepository.findAll(
                    RentalPropertySpecification.search(searchBuilder));
        }

        if (rentalProperties.isEmpty()) {
            throw new DataNotFoundException("khong tim thay nha tro phu hop");
        }

        List<Rental> responses = new ArrayList<>();
        for (RentalPropertyEntity rentalProperty : rentalProperties) {
            responses.add(rentalConverter.toRental(rentalProperty));
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public RentalDetail getRentalPropertyDetail(Long rentalPropertyId) {
        RentalPropertyEntity rentalProperty = getRentalPropertyById(rentalPropertyId);
        return rentalConverter.toRentalDetail(rentalProperty);
    }

    @Override
    @Transactional
    public String createRentalProperty(Long ownerId, RentalProperty request) {
        UserEntity owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new DataNotFoundException("Owner not found with id: " + ownerId));
        RentalTypeEntity rentalType = getOrCreateRentalType(request.getRentalTypeName());
        RentalPropertyEntity rentalProperty = buildRentalProperty(request, owner, rentalType);

        rentalPropertyRepository.save(rentalProperty);
        return "tao nha tro thanh cong";
    }

    @Override
    @Transactional
    public String updateRentalProperty(Long rentalPropertyId, RentalPropertyInfo request) {
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

        if (hasOccupiedRooms(rentalProperty)) {
            throw new IllegalArgumentException(
                    "Cannot delete rental property because one or more rooms are occupied");
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
    public String deleteRentalPropertyImage(Long imageId) {
        ImageEntity image = imageRepository.findById(imageId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Image not found with id: " + imageId));

        imageRepository.delete(image);
        return "xoa anh nha tro thanh cong";
    }

    private RentalPropertyEntity getRentalPropertyById(Long rentalPropertyId) {
        return rentalPropertyRepository.findById(rentalPropertyId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Rental property not found"));
    }

    private boolean hasOccupiedRooms(RentalPropertyEntity rentalProperty) {
        return rentalProperty.getRoomTypes().stream()
                .flatMap(roomType -> roomType.getRooms().stream())
                .anyMatch(room -> room.getCurrentTenant() != null);
    }

    private RentalTypeEntity getOrCreateRentalType(String rentalTypeName) {
        String normalizedName = rentalTypeName.trim().toLowerCase(java.util.Locale.ROOT);
        return rentalTypeRepository.findFirstByNameIgnoreCase(normalizedName)
                .orElseGet(() -> {
                    RentalTypeEntity rentalType = new RentalTypeEntity();
                    rentalType.setName(normalizedName);
                    return rentalTypeRepository.save(rentalType);
                });
    }

    private RentalPropertyEntity buildRentalProperty(
            RentalProperty request,
            UserEntity owner,
            RentalTypeEntity rentalType) {
        RentalPropertyEntity rentalProperty = modelMapper.map(request, RentalPropertyEntity.class);
        rentalProperty.setOwner(owner);
        rentalProperty.setRentalType(rentalType);
        rentalProperty.setImages(toImages(request.getImageUrls(), rentalProperty));
        rentalProperty.setRoomTypes(toRoomTypes(request.getRoomTypes(), rentalProperty));
        return rentalProperty;
    }

    private List<ImageEntity> toImages(List<String> imageUrls, RentalPropertyEntity rentalProperty) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return List.of();
        }

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
            List<RoomType> requests,
            RentalPropertyEntity rentalProperty) {
        return requests.stream()
                .map(request -> toRoomType(request, rentalProperty))
                .toList();
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
