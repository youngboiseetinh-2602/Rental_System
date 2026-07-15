package com.javaweb.service.impl;

import com.javaweb.customException.ConflictException;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.converter.ReviewConverter;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.ReviewEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.model.request.Review;
import com.javaweb.model.response.ReviewResponse;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.repository.ReviewRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ReviewConverter reviewConverter;
    private final RentalPropertyRepository rentalPropertyRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ModelMapper modelMapper;

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

    @Override
    @Transactional
    public String createReview(Long userId, Long rentalPropertyId, Review request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException("User not found with id: " + userId));
        RentalPropertyEntity rentalProperty = rentalPropertyRepository.findById(rentalPropertyId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Rental property not found with id: " + rentalPropertyId));

        if (reviewRepository.existsByUserIdAndRentalPropertyId(userId, rentalPropertyId)) {
            throw new ConflictException("User already reviewed this rental property");
        }

        ReviewEntity review = modelMapper.map(request, ReviewEntity.class);
        review.setUser(user);
        review.setRentalProperty(rentalProperty);
        reviewRepository.save(review);
        return "them danh gia thanh cong";
    }

    @Override
    @Transactional
    public String updateReview(Long userId, Long reviewId, Review request) {
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new DataNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not allowed to update this review");
        }

        review.setComment(request.getComment());
        reviewRepository.save(review);
        return "cap nhat danh gia thanh cong";
    }

    @Override
    @Transactional
    public String deleteReview(Long userId, Long reviewId) {
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new DataNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not allowed to delete this review");
        }

        reviewRepository.delete(review);
        return "xoa danh gia thanh cong";
    }
}
