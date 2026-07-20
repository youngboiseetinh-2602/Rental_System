package com.javaweb.model.response;

public record SecurityErrorResponse(
        int status,
        String error,
        String message,
        String path
) {
}
