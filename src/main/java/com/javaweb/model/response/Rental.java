package com.javaweb.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Rental {

    private Long id;

    private String name;

    private String city;

    private String ward;

    private String street;

    private String houseNumber;

    private String detailedAddress;

    private String houseRules;

    private Long ownerId;

    private String ownerName;

    private String ownerPhoneNumber;

    private String ownerAvatarUrl;

    private Long rentalTypeId;

    private String rentalTypeName;

    private String rentalTypeDescription;
}
