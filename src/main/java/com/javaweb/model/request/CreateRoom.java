package com.javaweb.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateRoom {

    @NotBlank(message = "Room name is required")
    @Size(max = 100, message = "Room name must not exceed 100 characters")
    private String name;
}
