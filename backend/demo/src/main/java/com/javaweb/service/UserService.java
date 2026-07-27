package com.javaweb.service;

import com.javaweb.model.request.ChangePassword;
import com.javaweb.model.request.Register;
import com.javaweb.model.request.UpdateUserInfo;
import com.javaweb.model.response.UserResponse;

public interface UserService {

    String register(Register request);

    UserResponse getUserInfo();

    String updateUserInfo(UpdateUserInfo request);

    String changePassword(ChangePassword request);
}
