package com.javaweb.model.request;

import com.javaweb.enums.UserGender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateUserInfo {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    @Pattern(regexp = "^(\\+?[0-9]{8,15})?$", message = "Phone number is invalid")
    private String phoneNumber;

    @Size(max = 255, message = "Avatar url must not exceed 255 characters")
    private String avatarUrl;

    private UserGender gender;
}
