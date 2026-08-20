package com.javaweb.model.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminContactResponse {

    private Long id;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
}
