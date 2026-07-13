package com.javaweb.api;

import com.javaweb.model.request.Register;
import com.javaweb.model.response.Rental;
import com.javaweb.model.response.RentalDetail;
import com.javaweb.model.response.ReviewResponse;
import com.javaweb.service.OwnerService;
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
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class publicController {

    private final UserService userService;
    private final OwnerService ownerService;
    private final ReviewService reviewService;

    // Dang ky tai khoan moi.
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody Register request) {
        return ResponseEntity.ok(userService.register(request));
    }

    // Xem danh sach nha tro dang tom tat.
    @GetMapping("/rentals")
    public ResponseEntity<List<Rental>> getRentalProperties() {
        return ResponseEntity.ok(ownerService.getRentalProperties());
    }

    // Xem chi tiet mot nha tro.
    @GetMapping("/rentals/{rentalPropertyId}")
    public ResponseEntity<RentalDetail> getRentalPropertyDetail(@PathVariable Long rentalPropertyId) {
        return ResponseEntity.ok(ownerService.getRentalPropertyDetail(rentalPropertyId));
    }

    // Xem danh sach review cua mot nha tro.
    @GetMapping("/rentals/{rentalPropertyId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long rentalPropertyId) {
        return ResponseEntity.ok(reviewService.reviewList(rentalPropertyId));
    }
}
