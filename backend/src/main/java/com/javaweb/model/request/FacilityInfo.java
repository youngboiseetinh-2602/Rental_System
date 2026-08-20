package com.javaweb.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FacilityInfo {

    @NotBlank(message = "Facility name is required")
    @Size(max = 100, message = "Facility name must not exceed 100 characters")
    private String facilityName;

    @NotNull(message = "Facility quantity is required")
    @Positive(message = "Facility quantity must be greater than 0")
    private Integer quantity;
}
