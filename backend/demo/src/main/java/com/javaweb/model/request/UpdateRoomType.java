package com.javaweb.model.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateRoomType {

    @NotBlank(message = "Room type name is required")
    @Size(max = 100, message = "Room type name must not exceed 100 characters")
    private String name;

    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    private BigDecimal area;

    @NotNull(message = "Monthly price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Monthly price must be greater than 0")
    private BigDecimal monthlyPrice;

    @Positive(message = "Max guests must be greater than 0")
    private Integer maxGuests;
}
