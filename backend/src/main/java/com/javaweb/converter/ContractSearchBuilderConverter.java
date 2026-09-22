package com.javaweb.converter;

import com.javaweb.builder.ContractSearchBuilder;
import com.javaweb.utils.MapUtil;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ContractSearchBuilderConverter {

    public ContractSearchBuilder toContractSearchBuilder(Map<String, Object> params) {
        return ContractSearchBuilder.builder()
                .from(parseMonth(MapUtil.getObject(params, "from", String.class), "from"))
                .to(parseMonth(MapUtil.getObject(params, "to", String.class), "to"))
                .build();
    }

    private YearMonth parseMonth(String value, String name) {
        if (value == null) {
            return null;
        }
        try {
            return YearMonth.parse(value);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Tháng " + name + " phải có dạng YYYY-MM", ex);
        }
    }
}
