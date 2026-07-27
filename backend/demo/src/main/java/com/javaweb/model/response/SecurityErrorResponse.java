package com.javaweb.model.response;

// Dinh dang JSON chung cho cac loi bao mat tra ve client.
public record SecurityErrorResponse(
        int status,
        String error,
        String message,
        String path
) {
}
