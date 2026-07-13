package com.javaweb.api;

import com.javaweb.model.request.CreateRentalProperty;
import com.javaweb.model.request.CreateRoom;
import com.javaweb.model.request.CreateRoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.UpdateRentalProperty;
import com.javaweb.service.OwnerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/owners")
@RequiredArgsConstructor
public class ownerController {

    private final OwnerService ownerService;

    // Tao nha tro moi cho owner.
    @PostMapping("/{ownerId}/rentals")
    public ResponseEntity<String> createRentalProperty(
            @PathVariable Long ownerId,
            @Valid @RequestBody CreateRentalProperty request
    ) {
        return ResponseEntity.ok(ownerService.createRentalProperty(ownerId, request));
    }

    // Cap nhat thong tin nha tro.
    @PutMapping("/rentals/{rentalPropertyId}")
    public ResponseEntity<String> updateRentalProperty(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody UpdateRentalProperty request
    ) {
        return ResponseEntity.ok(ownerService.updateRentalProperty(rentalPropertyId, request));
    }

    // Xoa nha tro.
    @DeleteMapping("/rentals/{rentalPropertyId}")
    public ResponseEntity<String> deleteRentalProperty(@PathVariable Long rentalPropertyId) {
        return ResponseEntity.ok(ownerService.deleteRentalProperty(rentalPropertyId));
    }

    // Them danh sach anh cho nha tro.
    @PostMapping("/rentals/{rentalPropertyId}/images")
    public ResponseEntity<String> addRentalPropertyImages(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody List<@NotBlank(message = "Image url is required")
                    @Size(max = 255, message = "Image url must not exceed 255 characters") String> imageUrls
    ) {
        return ResponseEntity.ok(ownerService.addRentalPropertyImages(rentalPropertyId, imageUrls));
    }

    // Them loai phong cho nha tro.
    @PostMapping("/rentals/{rentalPropertyId}/room-types")
    public ResponseEntity<String> addRoomType(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody CreateRoomType request
    ) {
        return ResponseEntity.ok(ownerService.addRoomType(rentalPropertyId, request));
    }

    // Xoa loai phong.
    @DeleteMapping("/room-types/{roomTypeId}")
    public ResponseEntity<String> deleteRoomType(@PathVariable Long roomTypeId) {
        return ResponseEntity.ok(ownerService.deleteRoomType(roomTypeId));
    }

    // Them co so vat chat cho loai phong.
    @PostMapping("/room-types/{roomTypeId}/facilities")
    public ResponseEntity<String> addFacility(
            @PathVariable Long roomTypeId,
            @Valid @RequestBody FacilityInfo request
    ) {
        return ResponseEntity.ok(ownerService.addFacility(roomTypeId, request));
    }

    // Cap nhat co so vat chat.
    @PutMapping("/facilities/{facilityId}")
    public ResponseEntity<String> updateFacility(
            @PathVariable Long facilityId,
            @Valid @RequestBody FacilityInfo request
    ) {
        return ResponseEntity.ok(ownerService.updateFacility(facilityId, request));
    }

    // Xoa co so vat chat.
    @DeleteMapping("/facilities/{facilityId}")
    public ResponseEntity<String> deleteFacility(@PathVariable Long facilityId) {
        return ResponseEntity.ok(ownerService.deleteFacility(facilityId));
    }

    // Them phong vao loai phong.
    @PostMapping("/room-types/{roomTypeId}/rooms")
    public ResponseEntity<String> addRoom(
            @PathVariable Long roomTypeId,
            @Valid @RequestBody CreateRoom request
    ) {
        return ResponseEntity.ok(ownerService.addRoom(roomTypeId, request));
    }

    // Xoa phong.
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<String> deleteRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(ownerService.deleteRoom(roomId));
    }
}
