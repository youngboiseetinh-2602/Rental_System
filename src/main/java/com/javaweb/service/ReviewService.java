package com.javaweb.service;

import com.javaweb.model.response.ReviewResponse;

import java.util.List;

public interface ReviewService {
    List<ReviewResponse> reviewList(Long id);
}
