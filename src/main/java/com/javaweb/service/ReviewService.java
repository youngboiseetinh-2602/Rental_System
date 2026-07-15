package com.javaweb.service;

import com.javaweb.model.request.Review;
import com.javaweb.model.response.ReviewResponse;

import java.util.List;

public interface ReviewService {

    List<ReviewResponse> reviewList(Long id);

    String createReview(Long userId, Long rentalPropertyId, Review request);

    String updateReview(Long userId, Long reviewId, Review request);

    String deleteReview(Long userId, Long reviewId);
}
