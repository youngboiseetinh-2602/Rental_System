package com.javaweb.service.impl;

import com.javaweb.builder.RentalSearchBuilder;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.converter.RentalPropertyConverter;
import com.javaweb.converter.RentalSearchBuilderConverter;
import com.javaweb.entity.FacilityEntity;
import com.javaweb.entity.ImageEntity;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RentalTypeEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.RoomTypeEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.model.request.RentalPropertyRequest;
import com.javaweb.model.request.Room;
import com.javaweb.model.request.RoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.RentalPropertyInfoRequest;
import com.javaweb.model.response.RentalPropertyDetailResponse;
import com.javaweb.model.response.RentalPropertyResponse;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.repository.ImageRepository;
import com.javaweb.repository.RoomRepository;
import com.javaweb.repository.RentalTypeRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.RentalPropertyService;
import com.javaweb.specification.RentalPropertySpecification;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RentalPropertyServiceImpl implements RentalPropertyService {

    private final UserRepository userRepository;
    private final RentalTypeRepository rentalTypeRepository;
    private final RentalPropertyRepository rentalPropertyRepository;
    private final RoomRepository roomRepository;
    private final ImageRepository imageRepository;
    private final ModelMapper modelMapper;
    private final RentalPropertyConverter rentalPropertyConverter;
    private final RentalSearchBuilderConverter rentalSearchBuilderConverter;
    private final CurrentUserContext currentUserContext;

    @Override
    @PreAuthorize(AuthorizationRules.PUBLIC)
    @Transactional(readOnly = true)
    public Page<RentalPropertyResponse> getRentalProperties(Pageable pageable) {
        Page<RentalPropertyEntity> rentalProperties = rentalPropertyRepository.findAll(pageable);
        if (rentalProperties.isEmpty()) {
            throw new DataNotFoundException("Không tìm thấy dữ liệu");
        }
        return rentalProperties.map(rentalPropertyConverter::toRentalPropertyResponse);
    }

    @Override
    @PreAuthorize(AuthorizationRules.PUBLIC)
    @Transactional
    public Page<RentalPropertyResponse> searchRentalProperties(Map<String, Object> params, Pageable pageable) {
        RentalSearchBuilder searchBuilder =
                rentalSearchBuilderConverter.toRentalSearchBuilder(params);
        if (searchBuilder == null || searchBuilder.isEmpty()) {
            return getRentalProperties(pageable);
        }
        Page<RentalPropertyEntity> rentalProperties = rentalPropertyRepository.findAll(
                RentalPropertySpecification.search(searchBuilder), pageable);
        if (rentalProperties.isEmpty()) {
            throw new DataNotFoundException("Không tìm thấy nhà trọ phù hợp");
        }
        return rentalProperties.map(rentalPropertyConverter::toRentalPropertyResponse);
    }

    @Override
    @PreAuthorize(AuthorizationRules.PUBLIC)
    @Transactional(readOnly = true)
    public RentalPropertyDetailResponse getRentalPropertyDetail(Long rentalPropertyId) {
        RentalPropertyEntity rentalProperty =
                rentalPropertyRepository.findById(rentalPropertyId)
                        .orElseThrow(() -> new DataNotFoundException(
                                "Không tìm thấy nhà trọ có mã: "
                                        + rentalPropertyId));

        return rentalPropertyConverter.toRentalPropertyDetailResponse(rentalProperty);
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER)
    @Transactional
    public String createRentalProperty(RentalPropertyRequest request) {
        Long ownerId = currentUserContext.getCurrentUserId();
        UserEntity owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy chủ trọ có mã: " + ownerId));
        RentalTypeEntity rentalType = getOrCreateRentalType(request.getRentalTypeName());
        RentalPropertyEntity rentalProperty = buildRentalProperty(request, owner, rentalType);

        rentalPropertyRepository.save(rentalProperty);
        return "Tạo nhà trọ thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String updateRentalProperty(Long rentalPropertyId, RentalPropertyInfoRequest request) {
        RentalPropertyEntity rentalProperty = getManageableRentalPropertyById(rentalPropertyId);
        RentalTypeEntity rentalType = getOrCreateRentalType(request.getRentalTypeName());

        modelMapper.map(request, rentalProperty);
        rentalProperty.setRentalType(rentalType);

        rentalPropertyRepository.save(rentalProperty);
        return "Cập nhật nhà trọ thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String deleteRentalProperty(Long rentalPropertyId) {
        RentalPropertyEntity rentalProperty = getManageableRentalPropertyById(rentalPropertyId);
        List<RoomEntity> rooms = lockRooms(
                roomRepository.findIdsByRentalPropertyId(rentalPropertyId));

        if (hasOccupiedRooms(rooms)) {
            throw new IllegalArgumentException(
                    "Không thể xóa nhà trọ vì có một hoặc nhiều phòng đang được thuê");
        }

        rentalPropertyRepository.delete(rentalProperty);
        return "Xóa nhà trọ thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String addRentalPropertyImages(Long rentalPropertyId, List<String> imageUrls) {
        RentalPropertyEntity rentalProperty = getManageableRentalPropertyById(rentalPropertyId);
        rentalProperty.getImages().addAll(toImages(imageUrls, rentalProperty));

        rentalPropertyRepository.save(rentalProperty);
        return "Thêm ảnh nhà trọ thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String deleteRentalPropertyImage(Long imageId) {
        ImageEntity image = imageRepository.findById(imageId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy ảnh có mã: " + imageId));
        checkManageAccess(image.getRentalProperty());

        imageRepository.delete(image);
        return "Xóa ảnh nhà trọ thành công";
    }

    private RentalPropertyEntity getManageableRentalPropertyById(Long rentalPropertyId) {
        RentalPropertyEntity rentalProperty =
                rentalPropertyRepository.findById(rentalPropertyId)
                        .orElseThrow(() -> new DataNotFoundException(
                                "Không tìm thấy nhà trọ có mã: "
                                        + rentalPropertyId));

        checkManageAccess(rentalProperty);
        return rentalProperty;
    }

    private void checkManageAccess(RentalPropertyEntity rentalProperty) {
        if (!rentalProperty.getOwner().getId().equals(
                currentUserContext.getCurrentUserId())
                && !currentUserContext.hasAuthority("ROLE_ADMIN")) {
            throw new ForbiddenException("Bạn không có quyền quản lý nhà trọ này");
        }
    }

    private boolean hasOccupiedRooms(List<RoomEntity> rooms) {
        return rooms.stream()
                .anyMatch(room -> room.getCurrentTenant() != null);
    }

    // Khoa cac phong theo id tang dan truoc khi xoa cascade nha tro.
    private List<RoomEntity> lockRooms(List<Long> roomIds) {
        return roomIds.stream()
                .map(roomId -> roomRepository.findByIdForUpdate(roomId)
                        .orElseThrow(() -> new DataNotFoundException(
                                "Không tìm thấy phòng có mã: " + roomId)))
                .toList();
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
            RentalPropertyRequest request,
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
