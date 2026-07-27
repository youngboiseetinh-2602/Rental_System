package com.javaweb.converter;

import com.javaweb.builder.UserSearchBuilder;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import com.javaweb.utils.MapUtil;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class UserSearchBuilderConverter {

    public UserSearchBuilder toUserSearchBuilder(Map<String, Object> params) {
        return UserSearchBuilder.builder()
                .role(MapUtil.getObject(params, "role", UserRole.class))
                .status(MapUtil.getObject(params, "status", UserStatus.class))
                .citizenCode(MapUtil.getObject(params, "citizenCode", String.class))
                .build();
    }
}
