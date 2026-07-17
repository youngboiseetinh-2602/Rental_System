package com.javaweb.api;

import com.javaweb.enums.UserStatus;
import com.javaweb.model.response.UserResponse;
import com.javaweb.model.request.UpdateRentalType;
import com.javaweb.model.response.RentalTypeResponse;
import com.javaweb.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class adminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> searchUsers(
            @RequestParam Map<String, Object> params) {
        return ResponseEntity.ok(adminService.searchUsers(params));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<String> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam UserStatus status) {
        return ResponseEntity.ok(adminService.updateUserStatus(userId, status));
    }

    @GetMapping("/rental-types")
    public ResponseEntity<List<RentalTypeResponse>> getRentalTypes() {
        return ResponseEntity.ok(adminService.getRentalTypes());
    }

    @PutMapping("/rental-types/{rentalTypeId}")
    public ResponseEntity<String> updateRentalType(
            @PathVariable Long rentalTypeId,
            @Valid @RequestBody UpdateRentalType request) {
        return ResponseEntity.ok(adminService.updateRentalType(rentalTypeId, request));
    }
}
