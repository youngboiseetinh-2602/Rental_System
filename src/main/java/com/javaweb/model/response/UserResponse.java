package com.javaweb.model.response;

import com.javaweb.enums.UserGender;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserResponse {

    private Long id;

    private String username;

    private String fullName;

    private String phoneNumber;

    private String citizenId;

    private String avatarUrl;

    private UserGender gender;

    private UserRole role;

    private UserStatus status;
}
