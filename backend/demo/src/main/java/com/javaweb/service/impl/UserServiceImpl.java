package com.javaweb.service.impl;

import com.javaweb.customException.ConflictException;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.converter.UserConverter;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import com.javaweb.model.request.ChangePassword;
import com.javaweb.model.request.Register;
import com.javaweb.model.request.UpdateUserInfo;
import com.javaweb.model.response.UserResponse;
import com.javaweb.model.response.AdminContactResponse;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.UserService;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final UserConverter userConverter;
    private final CurrentUserContext currentUserContext;

    @Override
    @PreAuthorize(AuthorizationRules.PUBLIC)
    @Transactional(readOnly = true)
    public AdminContactResponse getAdminContact() {
        UserEntity admin = userRepository
                .findFirstByRoleAndStatusOrderByIdAsc(
                        UserRole.ADMIN,
                        UserStatus.ACTIVE)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy quản trị viên đang hoạt động"));
        return new AdminContactResponse(
                admin.getId(),
                admin.getFullName(),
                admin.getPhoneNumber(),
                admin.getAvatarUrl());
    }

    @Override
    @PreAuthorize(AuthorizationRules.PUBLIC)
    @Transactional
    public String register(Register request) {
        validateRegistrationRole(request.getRole());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Tên đăng nhập đã tồn tại");
        }

        if (!StringUtils.hasText(request.getCitizenCode())) {
            throw new IllegalArgumentException("Citizen code is required");
        }

        if (userRepository.existsByCitizenCode(request.getCitizenCode())) {
            throw new ConflictException("Số căn cước công dân đã tồn tại");
        }

        if (StringUtils.hasText(request.getPhoneNumber())
                && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new ConflictException("Số điện thoại đã tồn tại");
        }

        UserEntity user = modelMapper.map(request, UserEntity.class);
        user.setCitizenCode(request.getCitizenCode());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setStatus(UserStatus.ACTIVE);

        userRepository.save(user);
        return "Đăng ký thành công";
    }

    private void validateRegistrationRole(UserRole role) {
        if (role != UserRole.OWNER && role != UserRole.CUSTOMER) {
            throw new IllegalArgumentException(
                    "Registration role must be OWNER or CUSTOMER");
        }
    }

    @Override
    @PreAuthorize(AuthorizationRules.USER)
    @Transactional(readOnly = true)
    public UserResponse getUserInfo() {
        Long userId = currentUserContext.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người dùng có mã: " + userId));

        return userConverter.toUserResponse(user);
    }

    @Override
    @PreAuthorize(AuthorizationRules.USER)
    @Transactional
    public String updateUserInfo(UpdateUserInfo request) {
        Long userId = currentUserContext.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người dùng có mã: " + userId));

        if (request.getUsername() != null) {
            String username = request.getUsername().trim();
            if (username.isEmpty()) {
                throw new IllegalArgumentException("Username must not be blank");
            }
            if (!username.equals(user.getUsername())) {
                userRepository.findByUsername(username)
                        .filter(existingUser -> !existingUser.getId().equals(userId))
                        .ifPresent(existingUser -> {
                            throw new ConflictException("Tên đăng nhập đã tồn tại");
                        });
                user.setUsername(username);
            }
        }

        if (request.getFullName() != null) {
            String fullName = request.getFullName().trim();
            if (fullName.isEmpty()) {
                throw new IllegalArgumentException("Full name must not be blank");
            }
            user.setFullName(fullName);
        }

        if (request.getPhoneNumber() != null) {
            String phoneNumber = request.getPhoneNumber().trim();
            if (phoneNumber.isEmpty()) {
                user.setPhoneNumber(null);
            } else {
                if (userRepository.existsByPhoneNumberAndIdNot(phoneNumber, userId)) {
                    throw new ConflictException("Số điện thoại đã tồn tại");
                }
                user.setPhoneNumber(phoneNumber);
            }
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        userRepository.save(user);
        return "Cập nhật thông tin thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.USER)
    @Transactional
    public String changePassword(ChangePassword request) {
        Long userId = currentUserContext.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người dùng có mã: " + userId));

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
        return "Đổi mật khẩu thành công";
    }

}
