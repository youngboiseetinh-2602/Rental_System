package com.javaweb.model.response;

/**
 * Biểu diễn cấu trúc phản hồi JSON thống nhất cho các lỗi bảo mật trả về phía người dùng.
 */
public record SecurityErrorResponse(
        int status,
        String error,
        String message,
        String path
) {
}
