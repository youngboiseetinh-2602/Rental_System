package com.javaweb.service.impl;

import com.javaweb.builder.UserSearchBuilder;
import com.javaweb.converter.UserConverter;
import com.javaweb.converter.UserSearchBuilderConverter;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ConflictException;
import com.javaweb.entity.RentalTypeEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserStatus;
import com.javaweb.model.response.UserResponse;
import com.javaweb.model.request.UpdateRentalType;
import com.javaweb.model.response.RentalTypeResponse;
import com.javaweb.repository.RentalTypeRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.AuthorizationRules;
import com.javaweb.service.AdminService;
import com.javaweb.specification.UserSpecification;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final UserConverter userConverter;
    private final UserSearchBuilderConverter userSearchBuilderConverter;
    private final RentalTypeRepository rentalTypeRepository;
    private final ModelMapper modelMapper;

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        Page<UserEntity> users = userRepository.findAll(pageable);
        if (users.isEmpty()) {
            throw new DataNotFoundException("Không tìm thấy tài khoản nào");
        }
        return users.map(userConverter::toUserResponse);
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(Map<String, Object> params, Pageable pageable) {
        UserSearchBuilder searchBuilder =
                userSearchBuilderConverter.toUserSearchBuilder(params);
        if (searchBuilder.isEmpty()) {
            return getAllUsers(pageable);
        }
        Page<UserEntity> users = userRepository.findAll(
                UserSpecification.search(searchBuilder), pageable);
        if (users.isEmpty()) {
            throw new DataNotFoundException("Không tìm thấy tài khoản phù hợp");
        }
        return users.map(userConverter::toUserResponse);
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional
    public String updateUserStatus(Long userId, UserStatus status) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy người dùng"));
        user.setStatus(status);
        userRepository.save(user);
        return "Cập nhật trạng thái tài khoản thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional(readOnly = true)
    public List<RentalTypeResponse> getRentalTypes() {
        List<RentalTypeEntity> rentalTypeEntities =
                rentalTypeRepository.findAll();
        if (rentalTypeEntities.isEmpty()) {
            throw new DataNotFoundException("Không tìm thấy loại hình cho thuê");
        }
        List<RentalTypeResponse> results = new ArrayList<>();
        for (RentalTypeEntity rentalTypeEntity : rentalTypeEntities) {
            results.add(modelMapper.map(
                    rentalTypeEntity, RentalTypeResponse.class));
        }
        return results;
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional
    public String updateRentalType(Long rentalTypeId, UpdateRentalType request) {
        RentalTypeEntity rentalType = rentalTypeRepository.findById(rentalTypeId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy loại hình cho thuê"));

        String normalizedName = request.getName().trim().toLowerCase(Locale.ROOT);
        if (rentalTypeRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, rentalTypeId)) {
            throw new ConflictException("Tên loại hình cho thuê đã tồn tại");
        }

        rentalType.setName(normalizedName);
        rentalType.setDescription(normalizeNullableText(request.getDescription()));
        rentalTypeRepository.save(rentalType);
        return "Cập nhật loại hình cho thuê thành công";
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

}
