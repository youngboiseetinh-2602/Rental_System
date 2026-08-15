package com.javaweb.converter;

import com.javaweb.entity.ReviewEntity;
import com.javaweb.model.response.ReviewResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReviewConverter {

    private final ModelMapper modelMapper;

    public ReviewResponse toReviewResponse(ReviewEntity reviewEntity) {
        ReviewResponse response = modelMapper.map(reviewEntity, ReviewResponse.class);
        response.setId(reviewEntity.getId());
        if (reviewEntity.getUser() != null) {
            response.setReviewerId(reviewEntity.getUser().getId());
            response.setReviewerName(reviewEntity.getUser().getFullName());
        }
        return response;
    }
}
