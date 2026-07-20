package com.javaweb.api;

import com.javaweb.model.request.ChangePassword;
import com.javaweb.model.request.RentalRequest;
import com.javaweb.model.request.Review;
import com.javaweb.model.request.UpdateUserInfo;
import com.javaweb.model.response.UserResponse;
import com.javaweb.model.response.NotificationResponse;
import com.javaweb.model.response.ContractResponse;
import com.javaweb.service.UserService;
import com.javaweb.service.ReviewService;
import com.javaweb.service.ContractService;
import com.javaweb.service.NotificationService;
import java.util.List;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class userController {

    private final UserService userService;
    private final ReviewService reviewService;
    private final ContractService contractService;
    private final NotificationService notificationService;

    // Lay danh sach yeu cau thue cua nguoi dung dang dang nhap.
    @GetMapping("/users/me/rental-requests")
    public ResponseEntity<List<ContractResponse>> getRentalRequests() {
        return ResponseEntity.ok(contractService.getUserRentalRequests());
    }

    // Lay danh sach thong bao cua nguoi dung dang dang nhap.
    @GetMapping("/users/me/notifications")
    public ResponseEntity<List<NotificationResponse>> getNotifications() {
        return ResponseEntity.ok(notificationService.getNotifications());
    }

    // Danh dau mot thong bao thuoc nguoi dung dang dang nhap la da doc.
    @PatchMapping("/users/me/notifications/{notificationId}")
    public ResponseEntity<String> readNotification(
            @PathVariable Long notificationId) {
        return ResponseEntity.ok(
                notificationService.readNotification(notificationId));
    }

    // Gui yeu cau thue phong cho nguoi dung dang dang nhap.
    @PostMapping("/users/me/rental-requests")
    public ResponseEntity<String> createRentalRequest(
            @Valid @RequestBody RentalRequest request) {
        return ResponseEntity.ok(contractService.createRentalRequest(request));
    }

    // Huy yeu cau thue dang PENDING cua nguoi dung dang dang nhap.
    @DeleteMapping("/users/me/rental-requests/{contractId}")
    public ResponseEntity<String> cancelRentalRequest(
            @PathVariable Long contractId) {
        return ResponseEntity.ok(
                contractService.cancelRentalRequest(contractId));
    }

    // Tao danh gia nha tro bang tai khoan dang dang nhap.
    @PostMapping("/users/me/rental-properties/{rentalPropertyId}/reviews")
    public ResponseEntity<String> createReview(
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody Review request) {
        return ResponseEntity.ok(reviewService.createReview(rentalPropertyId, request));
    }

    // Cap nhat danh gia thuoc nguoi dung dang dang nhap.
    @PatchMapping("/users/me/reviews/{reviewId}")
    public ResponseEntity<String> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody Review request) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request));
    }

    // Xoa danh gia thuoc nguoi dung dang dang nhap.
    @DeleteMapping("/users/me/reviews/{reviewId}")
    public ResponseEntity<String> deleteReview(
            @PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.deleteReview(reviewId));
    }

    // Lay thong tin ca nhan cua nguoi dung dang dang nhap.
    @GetMapping("/users/me")
    public ResponseEntity<UserResponse> getUser() {
        return ResponseEntity.ok(userService.getUserInfo());
    }

    // Cap nhat thong tin ca nhan cua nguoi dung dang dang nhap.
    @PutMapping("/users/me")
    public ResponseEntity<String> updateUser(
            @Valid @RequestBody UpdateUserInfo request) {
        return ResponseEntity.ok(userService.updateUserInfo(request));
    }

    // Doi mat khau cua nguoi dung dang dang nhap.
    @PatchMapping("/users/me/password")
    public ResponseEntity<String> changePassword(
            @Valid @RequestBody ChangePassword request) {
        return ResponseEntity.ok(userService.changePassword(request));
    }
}
