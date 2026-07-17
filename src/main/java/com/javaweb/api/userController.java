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

    // Lay cac yeu cau thue cua user.
    // test customer lấy yêu cầu thuê thành công //
    @GetMapping("/users/{userId}/rental-requests")
    public ResponseEntity<List<ContractResponse>> getRentalRequests(
            @PathVariable Long userId) {
        return ResponseEntity.ok(contractService.getUserRentalRequests(userId));
    }

    // Lay danh sach thong bao cua user.
    // test lấy thông báo thành công //
    @GetMapping("/users/{userId}/notifications")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    // Danh dau thong bao da doc khi user click.
    @PatchMapping("/users/{userId}/notifications/{notificationId}")
    public ResponseEntity<String> readNotification(
            @PathVariable Long userId,
            @PathVariable Long notificationId) {
        return ResponseEntity.ok(
                notificationService.readNotification(userId, notificationId));
    }

    // Gui yeu cau thue phong.
    @PostMapping("/users/{userId}/rental-requests")
    public ResponseEntity<String> createRentalRequest(
            @PathVariable Long userId,
            @Valid @RequestBody RentalRequest request) {
        return ResponseEntity.ok(contractService.createRentalRequest(userId, request));
    }

    // User huy yeu cau khi chu tro chua chap nhan.
    @DeleteMapping("/users/{userId}/rental-requests/{contractId}")
    public ResponseEntity<String> cancelRentalRequest(
            @PathVariable Long userId,
            @PathVariable Long contractId) {
        return ResponseEntity.ok(
                contractService.cancelRentalRequest(userId, contractId));
    }

    // Viet danh gia cho nha tro.
    // test viết review thành công //
    @PostMapping("/users/{userId}/rental-properties/{rentalPropertyId}/reviews")
    public ResponseEntity<String> createReview(
            @PathVariable Long userId,
            @PathVariable Long rentalPropertyId,
            @Valid @RequestBody Review request) {
        return ResponseEntity.ok(reviewService.createReview(userId, rentalPropertyId, request));
    }

    // Cap nhat danh gia cua user.
    @PatchMapping("/users/{userId}/reviews/{reviewId}")
    public ResponseEntity<String> updateReview(
            @PathVariable Long userId,
            @PathVariable Long reviewId,
            @Valid @RequestBody Review request) {
        return ResponseEntity.ok(reviewService.updateReview(userId, reviewId, request));
    }

    // Xoa danh gia cua user.
    // test xóa review thành công //
    @DeleteMapping("/users/{userId}/reviews/{reviewId}")
    public ResponseEntity<String> deleteReview(
            @PathVariable Long userId,
            @PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.deleteReview(userId, reviewId));
    }

    // Lay thong tin nguoi dung.
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserInfo(userId));
    }

    // Cap nhat thong tin nguoi dung.
    @PutMapping("/users/{userId}")
    public ResponseEntity<String> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserInfo request) {
        return ResponseEntity.ok(userService.updateUserInfo(userId, request));
    }

    // Doi mat khau nguoi dung.
    // test đổi mật khẩu thành công //
    @PatchMapping("/users/{userId}/password")
    public ResponseEntity<String> changePassword(
            @PathVariable Long userId,
            @Valid @RequestBody ChangePassword request) {
        return ResponseEntity.ok(userService.changePassword(userId, request));
    }
}
