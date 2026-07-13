package com.javaweb.service.impl;

import com.javaweb.customException.ConflictException;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserStatus;
import com.javaweb.model.request.ChangePassword;
import com.javaweb.model.request.Register;
import com.javaweb.model.request.UpdateUserInfo;
import com.javaweb.model.response.UserResponse;
import com.javaweb.repository.UserRepository;
import com.javaweb.service.UserService;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public String register(Register request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already exists");
        }

        if (StringUtils.hasText(request.getCitizenId())
                && userRepository.existsByCitizenId(request.getCitizenId())) {
            throw new ConflictException("Citizen id already exists");
        }

        UserEntity user = modelMapper.map(request, UserEntity.class);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);

        userRepository.save(user);
        return "dang ki thanh cong";
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserInfo(Long userId) {
        UserEntity user = getUserById(userId);
        return toUserResponse(user);
    }

    @Override
    @Transactional
    public String updateUserInfo(Long userId, UpdateUserInfo request) {
        UserEntity user = getUserById(userId);
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setGender(request.getGender());

        userRepository.save(user);
        return "cap nhat thong tin thanh cong";
    }

    @Override
    @Transactional
    public String changePassword(Long userId, ChangePassword request) {
        UserEntity user = getUserById(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        if (!Objects.equals(request.getNewPassword(), request.getConfirmPassword())) {
            throw new IllegalArgumentException("Confirm password does not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return "doi mat khau thanh cong";
    }

    private UserEntity getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException("User not found with id: " + userId));
    }

    private UserResponse toUserResponse(UserEntity user) {
        UserResponse userResponse = modelMapper.map(user, UserResponse.class);
        // TODO: Show citizenId only when allowed by SecurityContext.
        userResponse.setCitizenId(null);
        return userResponse;
    }
}
