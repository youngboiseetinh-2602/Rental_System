package com.javaweb.converter;

import com.javaweb.entity.UserEntity;
import com.javaweb.model.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserConverter {

    private final ModelMapper modelMapper;

    public UserResponse toUserResponse(UserEntity userEntity) {
        UserResponse response = modelMapper.map(userEntity, UserResponse.class);
        // TODO: Show citizenCode only when allowed by SecurityContext.
        response.setCitizenCode(null);
        return response;
    }
}
