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
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final CurrentUserContext currentUserContext;

    @Override
    @PreAuthorize(AuthorizationRules.PUBLIC)
    @Transactional(readOnly = true)
    public List<ReviewResponse> reviewList(Long id) {
        RentalPropertyEntity rental = rentalPropertyRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy nhà trọ"));
        List<ReviewEntity> reviews = rental.getReviews();

        if (reviews.isEmpty()) {
            throw new DataNotFoundException("Không tìm thấy dữ liệu");
        }

        List<ReviewResponse> responses = new ArrayList<>();

        for (ReviewEntity review : reviews) {
            responses.add(reviewConverter.toReviewResponse(review));
        }
        return responses;
    }

    @Override
    @PreAuthorize(AuthorizationRules.CUSTOMER)
    @Transactional
    public String createReview(Long rentalPropertyId, Review request) {
        Long userId = currentUserContext.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy người dùng có mã: " + userId));
        RentalPropertyEntity rentalProperty = rentalPropertyRepository.findById(rentalPropertyId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy nhà trọ có mã: " + rentalPropertyId));

        if (reviewRepository.existsByUserIdAndRentalPropertyId(userId, rentalPropertyId)) {
            throw new ConflictException("Bạn đã đánh giá nhà trọ này");
        }

        ReviewEntity review = modelMapper.map(request, ReviewEntity.class);
        review.setUser(user);
        review.setRentalProperty(rentalProperty);
        reviewRepository.save(review);
        return "Thêm đánh giá thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.CUSTOMER)
    @Transactional
    public String updateReview(Long reviewId, Review request) {
        Long userId = currentUserContext.getCurrentUserId();
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy đánh giá có mã: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền cập nhật đánh giá này");
        }

        modelMapper.map(request, review);
        reviewRepository.save(review);
        return "Cập nhật đánh giá thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.CUSTOMER)
    @Transactional
    public String deleteReview(Long reviewId) {
        Long userId = currentUserContext.getCurrentUserId();
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy đánh giá có mã: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xóa đánh giá này");
        }

        reviewRepository.delete(review);
        return "Xóa đánh giá thành công";
    }

}
