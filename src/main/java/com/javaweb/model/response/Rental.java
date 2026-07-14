package com.javaweb.model.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Rental {

    private Long id;

    private String name;

    private String description;

    private String city;

    private String ward;

    private String street;

    private String houseNumber;

    private String detailedAddress;

    private String houseRules;

    private String ownerName;

    private String ownerPhoneNumber;

    private String ownerAvatarUrl;

    private String rentalTypeName;

    private String rentalTypeDescription;
}
