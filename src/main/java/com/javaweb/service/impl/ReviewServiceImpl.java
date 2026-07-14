package com.javaweb.service.impl;

import com.javaweb.customException.DataNotFoundException;
import com.javaweb.converter.ReviewConverter;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.ReviewEntity;
import com.javaweb.model.response.ReviewResponse;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ReviewConverter reviewConverter;
    private final RentalPropertyRepository rentalPropertyRepository;

    @Override
    public List<ReviewResponse> reviewList(Long id) {
        RentalPropertyEntity rental = rentalPropertyRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("khong tim thay nha tro"));
        List<ReviewEntity> reviews = rental.getReviews();

        if (reviews.isEmpty()) {
            throw new DataNotFoundException("khong tim thay du lieu");
        }

        List<ReviewResponse> responses = new ArrayList<>();

        for (ReviewEntity review : reviews) {
            responses.add(reviewConverter.toReviewResponse(review));
        }
        return responses;
    }
}
