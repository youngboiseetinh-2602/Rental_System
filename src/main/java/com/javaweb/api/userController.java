package com.javaweb.api;

import com.javaweb.model.request.ChangePassword;
import com.javaweb.model.request.UpdateUserInfo;
import com.javaweb.model.response.UserResponse;
import com.javaweb.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class userController {

    private final UserService userService;

    // Lay thong tin nguoi dung.
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserInfo(userId));
    }

    // Cap nhat thong tin nguoi dung.
    @PutMapping("/{userId}")
    public ResponseEntity<String> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserInfo request) {
        return ResponseEntity.ok(userService.updateUserInfo(userId, request));
    }

    // Doi mat khau nguoi dung.
    @PatchMapping("/{userId}/password")
    public ResponseEntity<String> changePassword(
            @PathVariable Long userId,
            @Valid @RequestBody ChangePassword request) {
        return ResponseEntity.ok(userService.changePassword(userId, request));
    }
}
