package com.javaweb.service.impl;

import com.javaweb.customException.DataNotFoundException;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.ReviewEntity;
import com.javaweb.model.response.ReviewResponse;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ModelMapper modelMapper;
    private final RentalPropertyRepository rentalPropertyRepository;

    @Override
    public List<ReviewResponse> reviewList(Long id) {
        RentalPropertyEntity rental = rentalPropertyRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("khong tim thay nha tro"));
        List<ReviewEntity> reviews = rental.getReviews();
        List<ReviewResponse> responses = new ArrayList<>();

        for (ReviewEntity review : reviews) {
            ReviewResponse response = modelMapper.map(review, ReviewResponse.class);
            if (review.getUser() != null) {
                response.setReviewerName(review.getUser().getFullName());
            }
            responses.add(response);
        }
        if(responses.isEmpty()) {
            throw new DataNotFoundException("khong tim thay du lieu");
        }
        return responses;
    }
}
