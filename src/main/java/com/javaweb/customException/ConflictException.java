package com.javaweb.customException;

public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
