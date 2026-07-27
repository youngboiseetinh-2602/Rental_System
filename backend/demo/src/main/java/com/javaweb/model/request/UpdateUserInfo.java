package com.javaweb.model.request;

import com.javaweb.enums.UserGender;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateUserInfo {

    @Size(min = 4, max = 50, message = "Username must be between 4 and 50 characters")
    private String username;

    @Size(min = 1, max = 100, message = "Full name must be between 1 and 100 characters")
    private String fullName;

    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    @Pattern(regexp = "^(\\+?[0-9]{8,15})?$", message = "Phone number is invalid")
    private String phoneNumber;

    @Size(max = 255, message = "Avatar URL must not exceed 255 characters")
    private String avatarUrl;

    private UserGender gender;
}
