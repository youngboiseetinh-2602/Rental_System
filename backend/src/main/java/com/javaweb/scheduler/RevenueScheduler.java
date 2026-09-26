// /new/ - File moi cho thong ke doanh thu.
package com.javaweb.scheduler;

import com.javaweb.repository.UserRepository;
import com.javaweb.service.RevenueService;
import java.time.Clock;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RevenueScheduler {
    private final UserRepository userRepository;
    private final RevenueService revenueService;
    private final Clock revenueClock;

    @Scheduled(cron = "0 0 7 1 * *", zone = "Asia/Ho_Chi_Minh")
    public void initializeCurrentMonth() {
        YearMonth month = YearMonth.now(revenueClock);
        for (Long ownerId : userRepository.findOwnerIds()) {
            try {
                // Separate transaction per owner, through the service proxy.
                revenueService.initializeOwnerMonth(ownerId, month);
            } catch (RuntimeException exception) {
                log.error("Cannot initialize revenue for owner {} in {}", ownerId, month, exception);
            }
        }
    }
}
