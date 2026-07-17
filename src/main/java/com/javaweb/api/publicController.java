package com.javaweb.api;

import com.javaweb.model.request.Register;
import com.javaweb.model.request.UserLogin;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalDetail;
import com.javaweb.model.response.ReviewResponse;
import com.javaweb.service.RentalPropertyService;
import com.javaweb.service.ReviewService;
import com.javaweb.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class publicController {

    private final UserService userService;
    private final RentalPropertyService rentalPropertyService;
    private final ReviewService reviewService;

    // Dang nhap.
    // test login thành công //
    @PostMapping("/auth/login")
    public ResponseEntity<String> login(@Valid @RequestBody UserLogin request) {
        return ResponseEntity.ok(userService.login(request));
    }

    // Dang ky tai khoan moi.
    // test thành công //
    @PostMapping("/auth/register")
    public ResponseEntity<String> register(@Valid @RequestBody Register request) {
        return ResponseEntity.ok(userService.register(request));
    }

    // Xem danh sach nha tro dang tom tat.
    // test lấy tất cả nhà trọ thành công //
    @GetMapping("/rental-properties")
    public ResponseEntity<List<Rental>> getRentalProperties() {
        return ResponseEntity.ok(rentalPropertyService.getRentalProperties());
    }

    // Xem chi tiet mot nha tro.
    // test lấy chi tiết nhà trọ thành công //
    @GetMapping("/rental-properties/{rentalPropertyId}")
    public ResponseEntity<RentalDetail> getRentalPropertyDetail(@PathVariable Long rentalPropertyId) {
        return ResponseEntity.ok(rentalPropertyService.getRentalPropertyDetail(rentalPropertyId));
    }

    // Xem danh sach review cua mot nha tro.
    @GetMapping("/rental-properties/{rentalPropertyId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long rentalPropertyId) {
        return ResponseEntity.ok(reviewService.reviewList(rentalPropertyId));
    }
}
