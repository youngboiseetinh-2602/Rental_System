package com.javaweb.builder;

import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import lombok.Getter;

@Getter
public class UserSearchBuilder {

    private final UserRole role;
    private final UserStatus status;
    private final String citizenCode;

    private UserSearchBuilder(Builder builder) {
        this.role = builder.role;
        this.status = builder.status;
        this.citizenCode = builder.citizenCode;
    }

    public static Builder builder() {
        return new Builder();
    }

    public boolean isEmpty() {
        return role == null
                && status == null
                && (citizenCode == null || citizenCode.isBlank());
    }

    public static class Builder {

        private UserRole role;
        private UserStatus status;
        private String citizenCode;

        public Builder role(UserRole role) {
            this.role = role;
            return this;
        }

        public Builder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public Builder citizenCode(String citizenCode) {
            this.citizenCode = citizenCode;
            return this;
        }

        public UserSearchBuilder build() {
            return new UserSearchBuilder(this);
        }
    }
}
