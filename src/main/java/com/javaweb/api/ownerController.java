package com.javaweb.api;

import com.javaweb.enums.ContractStatus;
import com.javaweb.model.request.RentalProperty;
import com.javaweb.model.request.Room;
import com.javaweb.model.request.RoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.RentalPropertyInfo;
import com.javaweb.model.request.UpdateRoomType;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalRequestResponse;
import com.javaweb.service.OwnerService;
import com.javaweb.service.ContractService;
import com.javaweb.service.RentalPropertyService;
import com.javaweb.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ownerController {
    private final OwnerService ownerService;
    private final RentalPropertyService rentalPropertyService;
    private final RoomService roomService;
    private final ContractService contractService;

    // Chap nhan hoac huy yeu cau thue.
    @PatchMapping("/rental-requests/{contractId}")
    public ResponseEntity<String> processRentalRequest(
            @PathVariable Long contractId,
            @RequestParam ContractStatus status) {
        return ResponseEntity.ok(
                contractService.processRentalRequest(contractId, status));
    }

    // Lấy danh sách yêu cầu thuê nhà của owner theo thứ tự mới nhất trước.
    @GetMapping("/owners/{ownerId}/rental-requests")
    public ResponseEntity<List<RentalRequestResponse>> getOwnerRentalRequests(
            @PathVariable Long ownerId) {
        return ResponseEntity.ok(ownerService.getOwnerRentalRequests(ownerId));
    }

    // Lấy danh sách nha tro của owner.
    @GetMapping("/owners/{ownerId}/rental-properties")
    public ResponseEntity<List<Rental>> getMyRentals(@PathVariable Long ownerId) {
        return ResponseEntity.ok(ownerService.getOwnerRentals(ownerId));
    }

    // Tao nha tro moi cho owner.
    @PostMapping("/owners/{ownerId}/rental-properties")
    public ResponseEntity<String> createRentalProperty(
            @PathVariable Long ownerId,
            @Valid @RequestBody RentalProperty request) {
        return ResponseEntity.ok(rentalPropertyService.createRentalProperty(ownerId, request));
    }

    // Cap nhat thong tin nha tro.
    @PutMapping("/rental-properties/{rentalPropertyId}")
    public ResponseEntity<String> updateRentalProperty(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody RentalPropertyInfo request) {
        return ResponseEntity.ok(rentalPropertyService.updateRentalProperty(rentalPropertyId, request));
    }

    // Xoa nha tro.
    @DeleteMapping("/rental-properties/{rentalPropertyId}")
    public ResponseEntity<String> deleteRentalProperty(@PathVariable Long rentalPropertyId) {
        return ResponseEntity.ok(rentalPropertyService.deleteRentalProperty(rentalPropertyId));
    }

    // Them danh sach anh cho nha tro.
    @PostMapping("/rental-properties/{rentalPropertyId}/images")
    public ResponseEntity<String> addRentalPropertyImages(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody List<@NotBlank(message = "Image url is required") @Size(max = 255, message = "Image url must not exceed 255 characters") String> imageUrls) {
        return ResponseEntity.ok(rentalPropertyService.addRentalPropertyImages(rentalPropertyId, imageUrls));
    }

    // Xoa mot anh nha tro.
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<String> deleteRentalPropertyImage(
            @PathVariable Long imageId) {
        return ResponseEntity.ok(
                rentalPropertyService.deleteRentalPropertyImage(imageId));
    }

    // Them loai phong cho nha tro.
    @PostMapping("/rental-properties/{rentalPropertyId}/room-types")
    public ResponseEntity<String> addRoomType(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody RoomType request) {
        return ResponseEntity.ok(roomService.addRoomType(rentalPropertyId, request));
    }

    // Cap nhat loai phong.
    @PutMapping("/room-types/{roomTypeId}")
    public ResponseEntity<String> updateRoomType(
            @PathVariable Long roomTypeId,
            @Valid @RequestBody UpdateRoomType request) {
        return ResponseEntity.ok(roomService.updateRoomType(roomTypeId, request));
    }

    // Xoa loai phong.
    @DeleteMapping("/room-types/{roomTypeId}")
    public ResponseEntity<String> deleteRoomType(@PathVariable Long roomTypeId) {
        return ResponseEntity.ok(roomService.deleteRoomType(roomTypeId));
    }

    // Them co so vat chat cho loai phong.
    @PostMapping("/room-types/{roomTypeId}/facilities")
    public ResponseEntity<String> addFacility(
            @PathVariable Long roomTypeId,
            @Valid @RequestBody FacilityInfo request) {
        return ResponseEntity.ok(roomService.addFacility(roomTypeId, request));
    }

    // Cap nhat co so vat chat.
    @PutMapping("/facilities/{facilityId}")
    public ResponseEntity<String> updateFacility(
            @PathVariable Long facilityId,
            @Valid @RequestBody FacilityInfo request) {
        return ResponseEntity.ok(roomService.updateFacility(facilityId, request));
    }

    // Xoa co so vat chat.
    @DeleteMapping("/facilities/{facilityId}")
    public ResponseEntity<String> deleteFacility(@PathVariable Long facilityId) {
        return ResponseEntity.ok(roomService.deleteFacility(facilityId));
    }

    // Them phong vao loai phong.
    @PostMapping("/room-types/{roomTypeId}/rooms")
    public ResponseEntity<String> addRoom(
            @PathVariable Long roomTypeId,
            @Valid @RequestBody Room request) {
        return ResponseEntity.ok(roomService.addRoom(roomTypeId, request));
    }

    // Xoa phong.
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<String> deleteRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(roomService.deleteRoom(roomId));
    }
}
