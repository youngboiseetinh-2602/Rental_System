package com.javaweb.model.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RentalTypeResponse {

    private Long id;
    private String name;
    private String description;
}
