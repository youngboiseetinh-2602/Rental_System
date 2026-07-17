package com.javaweb.builder;

import java.math.BigDecimal;
import lombok.Getter;

@Getter
public class RentalSearchBuilder {

    private final String rentalType;
    private final String city;
    private final String ward;
    private final String street;
    private final BigDecimal minPrice;
    private final BigDecimal maxPrice;

    private RentalSearchBuilder(Builder builder) {
        this.rentalType = builder.rentalType;
        this.city = builder.city;
        this.ward = builder.ward;
        this.street = builder.street;
        this.minPrice = builder.minPrice;
        this.maxPrice = builder.maxPrice;
    }

    public static Builder builder() {
        return new Builder();
    }

    public boolean isEmpty() {
        return !hasText(rentalType)
                && !hasText(city)
                && !hasText(ward)
                && !hasText(street)
                && minPrice == null
                && maxPrice == null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public static class Builder {

        private String rentalType;
        private String city;
        private String ward;
        private String street;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;

        public Builder rentalType(String rentalType) {
            this.rentalType = rentalType;
            return this;
        }

        public Builder city(String city) {
            this.city = city;
            return this;
        }

        public Builder ward(String ward) {
            this.ward = ward;
            return this;
        }

        public Builder street(String street) {
            this.street = street;
            return this;
        }

        public Builder minPrice(BigDecimal minPrice) {
            this.minPrice = minPrice;
            return this;
        }

        public Builder maxPrice(BigDecimal maxPrice) {
            this.maxPrice = maxPrice;
            return this;
        }

        public RentalSearchBuilder build() {
            return new RentalSearchBuilder(this);
        }
    }
}
