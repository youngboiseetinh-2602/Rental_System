 package com.javaweb.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RentalPropertyInfo {

    @NotBlank(message = "Rental property name is required")
    @Size(max = 150, message = "Rental property name must not exceed 150 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotBlank(message = "Rental type name is required")
    @Size(max = 100, message = "Rental type name must not exceed 100 characters")
    private String rentalTypeName;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Size(max = 100, message = "Ward must not exceed 100 characters")
    private String ward;

    @Size(max = 100, message = "Street must not exceed 100 characters")
    private String street;

    @Size(max = 50, message = "House number must not exceed 50 characters")
    private String houseNumber;

    @Size(max = 255, message = "Detailed address must not exceed 255 characters")
    private String detailedAddress;

    @Size(max = 2000, message = "House rules must not exceed 2000 characters")
    private String houseRules;
}
