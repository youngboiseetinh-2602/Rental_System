package com.javaweb.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.javaweb.enums.RoomStatus;
import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RentalDetail extends Rental {

    private List<Image> images;

    private List<RoomType> roomTypes;

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Image {

        private Long id;

        private String imageUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RoomType {

        private Long id;

        private String name;

        private BigDecimal area;

        private BigDecimal monthlyPrice;

        private Integer maxGuests;

        private List<Facility> facilities;

        private List<Room> rooms;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Facility {

        private Long id;

        private String facilityName;

        private Integer quantity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Room {

        private Long id;

        private String name;

        private RoomStatus status;
    }
}
