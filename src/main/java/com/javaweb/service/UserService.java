package com.javaweb.service;

import com.javaweb.model.request.ChangePassword;
import com.javaweb.model.request.Register;
import com.javaweb.model.request.UpdateUserInfo;
import com.javaweb.model.response.UserResponse;

public interface UserService {

    String register(Register request);

    UserResponse getUserInfo(Long userId);

    String updateUserInfo(Long userId, UpdateUserInfo request);

    String changePassword(Long userId, ChangePassword request);
}
