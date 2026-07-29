package com.javaweb.service.impl;

import com.javaweb.converter.ContractConverter;
import com.javaweb.customException.ConflictException;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.entity.ContractEntity;
import com.javaweb.entity.FacilityEntity;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.RoomTypeEntity;
import com.javaweb.enums.ContractStatus;
import com.javaweb.model.request.Room;
import com.javaweb.model.request.RoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.UpdateRoomType;
import com.javaweb.model.response.ContractResponse;
import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.FacilityRepository;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.repository.RoomRepository;
import com.javaweb.repository.RoomTypeRepository;
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.RoomService;

import java.util.*;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RentalPropertyRepository rentalPropertyRepository;
    private final ContractConverter contractConverter;
    private final RoomTypeRepository roomTypeRepository;
    private final FacilityRepository facilityRepository;
    private final RoomRepository roomRepository;
    private final ContractRepository contractRepository;
    private final ModelMapper modelMapper;
    private final CurrentUserContext currentUserContext;

    @Override
    @PreAuthorize(AuthorizationRules.OWNER)
    @Transactional(readOnly = true)
    public List<ContractResponse> getCustomerByRental(Long id) {
        RentalPropertyEntity rentalProperty =
                rentalPropertyRepository.findById(id)
                        .orElseThrow(() -> new DataNotFoundException(
                                "Không tìm thấy nhà trọ có mã: " + id));

        if (!rentalProperty.getOwner().getId().equals(
                currentUserContext.getCurrentUserId())) {
            throw new ForbiddenException(
                    "Bạn không có quyền xem người thuê của nhà trọ này");
        }

        List<ContractEntity> contractEntities =
                contractRepository.findAllByRoom_RoomType_RentalProperty_Id(id);

        List<ContractResponse> results = new ArrayList<>();

        for (ContractEntity contractEntity : contractEntities) {
            if (contractEntity.getStatus() == ContractStatus.APPROVED
                    || contractEntity.getStatus() == ContractStatus.TERMINATED
                    || contractEntity.getStatus() == ContractStatus.EXPIRED) {
                results.add(contractConverter.toContractResponse(contractEntity));
            }
        }

        if (results.isEmpty()) {
            throw new DataNotFoundException("Nhà trọ chưa có người thuê");
        }

        return results;
    }


    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String addRoomType(Long rentalPropertyId, RoomType request) {
        RentalPropertyEntity rentalProperty = getRentalPropertyById(rentalPropertyId);
        RoomTypeEntity roomType = toRoomType(request, rentalProperty);

        roomTypeRepository.save(roomType);
        return "Thêm loại phòng thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
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
            throw new ConflictException("Tên loại phòng đã tồn tại trong nhà trọ này");
        }

        modelMapper.map(request, roomType);
        roomType.setName(normalizedName);
        roomTypeRepository.save(roomType);
        return "Cập nhật loại phòng thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String deleteRoomType(Long roomTypeId) {
        RoomTypeEntity roomType = getRoomTypeById(roomTypeId);
        List<RoomEntity> rooms = lockRooms(
                roomRepository.findIdsByRoomTypeId(roomTypeId));
        boolean hasCurrentTenant = rooms.stream()
                .anyMatch(room -> room.getCurrentTenant() != null);
        if (hasCurrentTenant) {
            throw new IllegalArgumentException(
                    "Không thể xóa loại phòng vì có một hoặc nhiều phòng đang được thuê");
        }
        roomTypeRepository.delete(roomType);
        return "Xóa loại phòng thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String addFacilities(Long roomTypeId, List<FacilityInfo> requests) {
        RoomTypeEntity roomType = getRoomTypeById(roomTypeId);
        List<FacilityEntity> facilities = requests.stream()
                .map(request -> {
                    FacilityEntity facility = modelMapper.map(request, FacilityEntity.class);
                    facility.setRoomType(roomType);
                    return facility;
                })
                .toList();

        facilityRepository.saveAll(facilities);
        return "Thêm danh sách cơ sở vật chất thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String updateFacility(Long facilityId, FacilityInfo request) {
        FacilityEntity facility = getFacilityById(facilityId);

        modelMapper.map(request, facility);
        facilityRepository.save(facility);
        return "Cập nhật cơ sở vật chất thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String deleteFacility(Long facilityId) {
        FacilityEntity facility = getFacilityById(facilityId);
        facilityRepository.delete(facility);
        return "Xóa cơ sở vật chất thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
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
                                "Tên phòng đã tồn tại trong nhà trọ này: " + normalizedRoomName);
                    }

                    RoomEntity room = modelMapper.map(request, RoomEntity.class);
                    room.setName(normalizedRoomName);
                    room.setRoomType(roomType);
                    return room;
                })
                .toList();

        roomRepository.saveAll(rooms);
        return "Thêm danh sách phòng thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String deleteRoom(Long roomId) {
        RoomEntity room = getRoomById(roomId);

        if (room.getCurrentTenant() != null) {
            throw new IllegalArgumentException("Không thể xóa phòng vì phòng hiện đang được thuê");
        }

        roomRepository.delete(room);
        return "Xóa phòng thành công";
    }

    private RentalPropertyEntity getRentalPropertyById(Long rentalPropertyId) {
        RentalPropertyEntity rentalProperty = rentalPropertyRepository.findById(rentalPropertyId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy nhà trọ có mã: " + rentalPropertyId));
        checkManageAccess(rentalProperty);
        return rentalProperty;
    }

    private RoomTypeEntity getRoomTypeById(Long roomTypeId) {
        RoomTypeEntity roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy loại phòng có mã: " + roomTypeId));
        checkManageAccess(roomType.getRentalProperty());
        return roomType;
    }

    private FacilityEntity getFacilityById(Long facilityId) {
        FacilityEntity facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy tiện nghi có mã: " + facilityId));
        checkManageAccess(facility.getRoomType().getRentalProperty());
        return facility;
    }

    private RoomEntity getRoomById(Long roomId) {
        RoomEntity room = roomRepository.findByIdForUpdate(roomId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy phòng có mã: " + roomId));
        checkManageAccess(room.getRoomType().getRentalProperty());
        return room;
    }

    // Khoa cac phong theo id tang dan truoc khi xoa cascade room type.
    private List<RoomEntity> lockRooms(List<Long> roomIds) {
        return roomIds.stream()
                .map(roomId -> roomRepository.findByIdForUpdate(roomId)
                        .orElseThrow(() -> new DataNotFoundException(
                                "Không tìm thấy phòng có mã: " + roomId)))
                .toList();
    }

    private void checkManageAccess(RentalPropertyEntity rentalProperty) {
        if (!rentalProperty.getOwner().getId().equals(
                currentUserContext.getCurrentUserId())
                && !currentUserContext.hasAuthority("ROLE_ADMIN")) {
            throw new ForbiddenException("Bạn không có quyền quản lý nhà trọ này");
        }
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
