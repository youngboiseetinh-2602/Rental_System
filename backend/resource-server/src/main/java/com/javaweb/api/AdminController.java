package com.javaweb.api;

import com.javaweb.enums.UserStatus;
import com.javaweb.model.response.UserResponse;
import com.javaweb.model.request.UpdateRentalType;
import com.javaweb.model.response.RentalTypeResponse;
import com.javaweb.service.AdminService;
import com.javaweb.service.ContractService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
public class AdminController {

    private final AdminService adminService;
    private final ContractService contractService;

    // Tim kiem va lay danh sach tai khoan theo cac dieu kien quan tri.
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @RequestParam Map<String, Object> params,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(adminService.searchUsers(params, pageable));
    }

    // Cap nhat trang thai ACTIVE, INACTIVE hoac LOCKED cua mot tai khoan.
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<String> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam UserStatus status) {
        return ResponseEntity.ok(adminService.updateUserStatus(userId, status));
    }

    // Lay danh sach loai hinh cho thue.
    @GetMapping("/rental-types")
    public ResponseEntity<List<RentalTypeResponse>> getRentalTypes() {
        return ResponseEntity.ok(adminService.getRentalTypes());
    }

    // Cap nhat thong tin mot loai hinh cho thue.
    @PutMapping("/rental-types/{rentalTypeId}")
    public ResponseEntity<String> updateRentalType(
            @PathVariable Long rentalTypeId,
            @Valid @RequestBody UpdateRentalType request) {
        return ResponseEntity.ok(adminService.updateRentalType(rentalTypeId, request));
    }

    // Ket thuc hop dong dang hieu luc, giu lich su va giai phong phong dang thue.
    @PatchMapping("/contracts/{contractId}/terminate")
    public ResponseEntity<String> terminateContract(@PathVariable Long contractId) {
        return ResponseEntity.ok(contractService.terminateContract(contractId));
    }
}
