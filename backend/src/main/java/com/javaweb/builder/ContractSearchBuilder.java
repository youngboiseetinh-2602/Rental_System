package com.javaweb.builder;

import java.time.ZoneId;
import java.time.YearMonth;
import lombok.Getter;

@Getter
public class ContractSearchBuilder {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final YearMonth from;
    private final YearMonth to;

    private ContractSearchBuilder(Builder builder) {
        YearMonth currentMonth = YearMonth.now(VIETNAM_ZONE);
        this.from = builder.from == null && builder.to == null
                ? currentMonth : builder.from;
        this.to = builder.to == null ? currentMonth.plusMonths(1) : builder.to;
        if (from != null && !from.isBefore(to)) {
            throw new IllegalArgumentException("Tháng bắt đầu phải trước tháng kết thúc");
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private YearMonth from;
        private YearMonth to;

        public Builder from(YearMonth from) {
            this.from = from;
            return this;
        }

        public Builder to(YearMonth to) {
            this.to = to;
            return this;
        }

        public ContractSearchBuilder build() {
            return new ContractSearchBuilder(this);
        }
    }
}
