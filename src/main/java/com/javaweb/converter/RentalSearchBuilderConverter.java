package com.javaweb.converter;

import com.javaweb.builder.RentalSearchBuilder;
import com.javaweb.utils.MapUtil;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class RentalSearchBuilderConverter {

    public RentalSearchBuilder toRentalSearchBuilder(Map<String, ?> params) {
        return RentalSearchBuilder.builder()
                .rentalType(MapUtil.getObject(params, "rentalType", String.class))
                .city(MapUtil.getObject(params, "city", String.class))
                .ward(MapUtil.getObject(params, "ward", String.class))
                .street(MapUtil.getObject(params, "street", String.class))
                .minPrice(MapUtil.getObject(params, "minPrice", BigDecimal.class))
                .maxPrice(MapUtil.getObject(params, "maxPrice", BigDecimal.class))
                .build();
    }
}
