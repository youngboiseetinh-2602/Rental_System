// /new/ - File moi cho thong ke doanh thu.
package com.javaweb.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RevenueClockConfig {
    @Bean
    public Clock revenueClock() {
        return Clock.system(ZoneId.of("Asia/Ho_Chi_Minh"));
    }
}
