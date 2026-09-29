package com.javaweb.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserRole;
import com.javaweb.model.request.UpdateUserInfo;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CurrentUserContext;
import java.util.Optional;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {
    @Mock UserRepository userRepository;
    @Mock CurrentUserContext currentUserContext;
    @InjectMocks UserServiceImpl service;

    private UserEntity currentUser(UserRole role) {
        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setUsername("original");
        user.setFullName("Original Name");
        user.setRole(role);
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        return user;
    }

    @ParameterizedTest
    @EnumSource(UserRole.class)
    void ignoresUsernameInLegacyPayload(UserRole role) throws Exception {
        UserEntity user = currentUser(role);
        ObjectMapper mapper = new ObjectMapper()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        UpdateUserInfo request = mapper.readValue(
                "{\"username\":\"changed\",\"fullName\":\"Updated Name\"}", UpdateUserInfo.class);

        service.updateUserInfo(request);

        assertEquals("original", user.getUsername());
        assertEquals("Updated Name", user.getFullName());
        verify(userRepository).save(user);
    }

    @ParameterizedTest
    @EnumSource(UserRole.class)
    void updatesProfileWithoutUsername(UserRole role) {
        UserEntity user = currentUser(role);
        UpdateUserInfo request = new UpdateUserInfo();
        request.setFullName("Updated Name");

        service.updateUserInfo(request);

        assertEquals("original", user.getUsername());
        assertEquals("Updated Name", user.getFullName());
        verify(userRepository).save(user);
    }

    @ParameterizedTest
    @EnumSource(UserRole.class)
    void updatesAvatarWithoutChangingUsername(UserRole role) {
        UserEntity user = currentUser(role);
        UpdateUserInfo request = new UpdateUserInfo();
        request.setAvatarUrl("https://example.com/avatar.png");

        service.updateUserInfo(request);

        assertEquals("original", user.getUsername());
        assertEquals(request.getAvatarUrl(), user.getAvatarUrl());
        verify(userRepository).save(user);
    }
}
