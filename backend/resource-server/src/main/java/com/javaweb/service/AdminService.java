package com.javaweb.service;

import com.javaweb.model.response.UserResponse;
import com.javaweb.model.request.UpdateRentalType;
import com.javaweb.model.response.RentalTypeResponse;
import com.javaweb.enums.UserStatus;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    Page<UserResponse> getAllUsers(Pageable pageable);

    Page<UserResponse> searchUsers(Map<String, Object> params, Pageable pageable);

    String updateUserStatus(Long userId, UserStatus status);

    List<RentalTypeResponse> getRentalTypes();

    String updateRentalType(Long rentalTypeId, UpdateRentalType request);
}
