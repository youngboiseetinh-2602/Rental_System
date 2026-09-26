package com.javaweb.api;

import com.javaweb.enums.UserStatus;
import com.javaweb.model.response.UserResponse;
import com.javaweb.model.request.UpdateRentalType;
import com.javaweb.model.response.RentalTypeResponse;
import com.javaweb.model.response.ContractResponse;
import com.javaweb.model.response.RevenueResponse;
import com.javaweb.model.response.OwnerRevenueStatusResponse;
import com.javaweb.service.RevenueService;
import com.javaweb.service.AdminService;
import com.javaweb.service.NotificationService;
import com.javaweb.model.request.NotificationRequest;
import com.javaweb.model.response.NotificationResponse;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final NotificationService notificationService;
    // /new/
    private final RevenueService revenueService;

    // /new/
    @GetMapping("/revenue/current")
    public ResponseEntity<RevenueResponse> currentRevenue() {
        return ResponseEntity.ok(revenueService.getAdminCurrentRevenue());
    }

    // /new/
    @GetMapping("/revenue/history")
    public ResponseEntity<List<RevenueResponse>> revenueHistory() {
        return ResponseEntity.ok(revenueService.getAdminHistory());
    }

    // /new/
    @GetMapping("/revenue/missing-owners")
    public ResponseEntity<List<OwnerRevenueStatusResponse>> ownersMissingRevenue() {
        return ResponseEntity.ok(revenueService.getOwnersMissingRevenue());
    }

    @GetMapping("/contracts/dashboard")
    public ResponseEntity<Page<ContractResponse>> contractDashboard(
            @RequestParam Map<String, Object> params,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(adminService.contractDashboard(params, pageable));
    }

    @GetMapping("/notifications/sent")
    public ResponseEntity<List<com.javaweb.model.response.NotificationResponse>> getSentNotifications() {
        return ResponseEntity.ok(notificationService.getSentNotifications());
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<String> sendNotificationToAll(
            @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.ok(notificationService.sendNotificationToAll(request));
    }

    @PostMapping("/notifications/{receiverId}")
    public ResponseEntity<NotificationResponse> sendPrivateNotification(
            @PathVariable Long receiverId,
            @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.ok(notificationService.createNotification(receiverId, request));
    }

    // Tim kiem va lay danh sach tai khoan theo cac dieu kien quan tri.
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @RequestParam Map<String, Object> params,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC)
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

    @PostMapping("/rental-types")
    public ResponseEntity<String> createRentalType(
            @Valid @RequestBody UpdateRentalType request) {
        return ResponseEntity.ok(adminService.createRentalType(request));
    }

    // Cap nhat thong tin mot loai hinh cho thue.
    @PutMapping("/rental-types/{rentalTypeId}")
    public ResponseEntity<String> updateRentalType(
            @PathVariable Long rentalTypeId,
            @Valid @RequestBody UpdateRentalType request) {
        return ResponseEntity.ok(adminService.updateRentalType(rentalTypeId, request));
    }

    @DeleteMapping("/rental-types/{rentalTypeId}")
    public ResponseEntity<String> deleteRentalType(@PathVariable Long rentalTypeId) {
        return ResponseEntity.ok(adminService.deleteRentalType(rentalTypeId));
    }

}
