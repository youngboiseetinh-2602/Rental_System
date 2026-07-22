package com.javaweb.api;

import com.javaweb.enums.ContractStatus;
import com.javaweb.model.request.RentalProperty;
import com.javaweb.model.request.Room;
import com.javaweb.model.request.RoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.RentalPropertyInfo;
import com.javaweb.model.request.UpdateRoomType;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.ContractResponse;
import com.javaweb.service.OwnerService;
import com.javaweb.service.ContractService;
import com.javaweb.service.RentalPropertyService;
import com.javaweb.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
public class OwnerController {
    private final OwnerService ownerService;
    private final RentalPropertyService rentalPropertyService;
    private final RoomService roomService;
    private final ContractService contractService;

    // Chap nhan hoac tu choi yeu cau thue thuoc nha tro cua owner dang dang nhap.
    @PatchMapping("/rental-requests/{contractId}")
    public ResponseEntity<String> processRentalRequest(
            @PathVariable Long contractId,
            @RequestParam ContractStatus status) {
        return ResponseEntity.ok(
                contractService.processRentalRequest(contractId, status));
    }

    // Lay danh sach yeu cau thue gui den cac nha tro cua owner dang dang nhap.
    @GetMapping("/owners/me/rental-requests")
    public ResponseEntity<List<ContractResponse>> getOwnerRentalRequests() {
        return ResponseEntity.ok(ownerService.getOwnerRentalRequests());
    }

    // Lay danh sach nha tro thuoc owner dang dang nhap.
    @GetMapping("/owners/me/rental-properties")
    public ResponseEntity<List<Rental>> getMyRentals() {
        return ResponseEntity.ok(ownerService.getOwnerRentals());
    }

    // Tao nha tro moi cho owner dang dang nhap.
    @PostMapping("/owners/me/rental-properties")
    public ResponseEntity<String> createRentalProperty(
            @Valid @RequestBody RentalProperty request) {
        return ResponseEntity.ok(rentalPropertyService.createRentalProperty(request));
    }

    // Cap nhat nha tro neu thuoc owner dang dang nhap; ADMIN duoc phep quan tri.
    @PutMapping("/rental-properties/{rentalPropertyId}")
    public ResponseEntity<String> updateRentalProperty(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody RentalPropertyInfo request) {
        return ResponseEntity.ok(rentalPropertyService.updateRentalProperty(rentalPropertyId, request));
    }

    // Xoa nha tro neu thuoc owner dang dang nhap va khong co phong dang duoc thue.
    @DeleteMapping("/rental-properties/{rentalPropertyId}")
    public ResponseEntity<String> deleteRentalProperty(@PathVariable Long rentalPropertyId) {
        return ResponseEntity.ok(rentalPropertyService.deleteRentalProperty(rentalPropertyId));
    }

    // Them danh sach anh vao nha tro ma owner dang dang nhap duoc quan ly.
    @PostMapping("/rental-properties/{rentalPropertyId}/images")
    public ResponseEntity<String> addRentalPropertyImages(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody List<@NotBlank(message = "Image url is required") @Size(max = 255, message = "Image url must not exceed 255 characters") String> imageUrls) {
        return ResponseEntity.ok(rentalPropertyService.addRentalPropertyImages(rentalPropertyId, imageUrls));
    }

    // Xoa anh thuoc nha tro ma owner dang dang nhap duoc quan ly.
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<String> deleteRentalPropertyImage(
            @PathVariable Long imageId) {
        return ResponseEntity.ok(
                rentalPropertyService.deleteRentalPropertyImage(imageId));
    }

    // Them loai phong vao nha tro ma owner dang dang nhap duoc quan ly.
    @PostMapping("/rental-properties/{rentalPropertyId}/room-types")
    public ResponseEntity<String> addRoomType(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody RoomType request) {
        return ResponseEntity.ok(roomService.addRoomType(rentalPropertyId, request));
    }

    // Cap nhat loai phong thuoc nha tro ma owner dang dang nhap duoc quan ly.
    @PutMapping("/room-types/{roomTypeId}")
    public ResponseEntity<String> updateRoomType(
            @PathVariable Long roomTypeId,
            @Valid @RequestBody UpdateRoomType request) {
        return ResponseEntity.ok(roomService.updateRoomType(roomTypeId, request));
    }

    // Xoa loai phong neu khong co phong nao dang duoc thue.
    @DeleteMapping("/room-types/{roomTypeId}")
    public ResponseEntity<String> deleteRoomType(@PathVariable Long roomTypeId) {
        return ResponseEntity.ok(roomService.deleteRoomType(roomTypeId));
    }

    // Them danh sach co so vat chat vao loai phong duoc owner quan ly.
    @PostMapping("/room-types/{roomTypeId}/facilities")
    public ResponseEntity<String> addFacilities(
            @PathVariable Long roomTypeId,
            @NotEmpty(message = "Facility list must not be empty")
            @RequestBody List<@Valid FacilityInfo> requests) {
        return ResponseEntity.ok(roomService.addFacilities(roomTypeId, requests));
    }

    // Cap nhat co so vat chat thuoc nha tro duoc owner quan ly.
    @PutMapping("/facilities/{facilityId}")
    public ResponseEntity<String> updateFacility(
            @PathVariable Long facilityId,
            @Valid @RequestBody FacilityInfo request) {
        return ResponseEntity.ok(roomService.updateFacility(facilityId, request));
    }

    // Xoa co so vat chat thuoc nha tro duoc owner quan ly.
    @DeleteMapping("/facilities/{facilityId}")
    public ResponseEntity<String> deleteFacility(@PathVariable Long facilityId) {
        return ResponseEntity.ok(roomService.deleteFacility(facilityId));
    }

    // Them danh sach phong vao loai phong duoc owner quan ly.
    @PostMapping("/room-types/{roomTypeId}/rooms")
    public ResponseEntity<String> addRooms(
            @PathVariable Long roomTypeId,
            @NotEmpty(message = "Room list must not be empty")
            @RequestBody List<@Valid Room> requests) {
        return ResponseEntity.ok(roomService.addRooms(roomTypeId, requests));
    }

    // Xoa phong neu phong thuoc owner dang dang nhap va chua duoc thue.
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<String> deleteRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(roomService.deleteRoom(roomId));
    }
}
