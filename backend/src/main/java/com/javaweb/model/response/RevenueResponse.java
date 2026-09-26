// /new/ - File moi cho thong ke doanh thu.
package com.javaweb.model.response;

import java.math.BigDecimal;

public record RevenueResponse(Short year, Byte month, BigDecimal revenue, BigDecimal profit) {}
