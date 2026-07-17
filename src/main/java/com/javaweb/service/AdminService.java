package com.javaweb.service;

import com.javaweb.model.response.UserResponse;
import com.javaweb.model.request.UpdateRentalType;
import com.javaweb.model.response.RentalTypeResponse;
import com.javaweb.enums.UserStatus;
import java.util.List;
import java.util.Map;

public interface AdminService {

    List<UserResponse> getAllUsers();

    List<UserResponse> searchUsers(Map<String, Object> params);

    String updateUserStatus(Long userId, UserStatus status);

    List<RentalTypeResponse> getRentalTypes();

    String updateRentalType(Long rentalTypeId, UpdateRentalType request);
}
