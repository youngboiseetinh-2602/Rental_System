package com.javaweb.model.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateRentalProperty extends RentalPropertyInfo {

    private List<@NotBlank(message = "Image url is required")
            @Size(max = 255, message = "Image url must not exceed 255 characters") String> imageUrls;

    @Valid
    @NotEmpty(message = "Room types are required")
    private List<CreateRoomType> roomTypes;
}
