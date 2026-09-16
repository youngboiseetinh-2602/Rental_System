package com.javaweb.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.javaweb.converter.NotificationConverter;
import com.javaweb.entity.NotificationEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.NotificationStatus;
import com.javaweb.model.request.NotificationRequest;
import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.NotificationRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.NotificationService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.method.AuthorizationManagerBeforeMethodInterceptor;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {
    @Mock UserRepository userRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock ContractRepository contractRepository;
    @Mock NotificationConverter notificationConverter;
    @Mock CurrentUserContext currentUserContext;
    @InjectMocks NotificationServiceImpl service;

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private NotificationService securedService(String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user", "unused",
                        AuthorityUtils.createAuthorityList("ROLE_" + role)));
        ProxyFactory factory = new ProxyFactory(service);
        factory.addAdvice(AuthorizationManagerBeforeMethodInterceptor.preAuthorize());
        return (NotificationService) factory.getProxy();
    }

    private NotificationRequest request() {
        NotificationRequest request = new NotificationRequest();
        request.setTitle("Maintenance");
        request.setContent("Maintenance tomorrow");
        return request;
    }

    @Test
    void adminCreatesSeparateUnreadNotificationsForEveryUserIncludingSender() {
        UserEntity sender = new UserEntity();
        sender.setId(1L);
        UserEntity recipient = new UserEntity();
        recipient.setId(2L);
        when(currentUserContext.getCurrentUserId()).thenReturn(1L);
        when(userRepository.findAll()).thenReturn(List.of(sender, recipient));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(userRepository.findById(2L)).thenReturn(Optional.of(recipient));

        assertEquals("Gửi thông báo thành công",
                securedService("ADMIN").sendNotificationToAll(request()));

        ArgumentCaptor<NotificationEntity> saved = ArgumentCaptor.forClass(NotificationEntity.class);
        verify(notificationRepository, times(2)).save(saved.capture());
        List<NotificationEntity> notifications = saved.getAllValues();
        assertNotSame(notifications.get(0), notifications.get(1));
        assertEquals(List.of(1L, 2L), notifications.stream()
                .map(notification -> notification.getReceiver().getId()).toList());
        for (NotificationEntity notification : notifications) {
            assertSame(sender, notification.getSender());
            assertEquals("Maintenance", notification.getTitle());
            assertEquals("Maintenance tomorrow", notification.getContent());
            assertEquals(NotificationStatus.UNREAD, notification.getStatus());
            assertNull(notification.getReadAt());
        }
    }

    @Test
    void ownerAndCustomerCannotBroadcast() {
        for (String role : List.of("OWNER", "CUSTOMER")) {
            NotificationService secured = securedService(role);
            assertThrows(AccessDeniedException.class, () -> secured.sendNotificationToAll(request()));
        }
        verifyNoInteractions(userRepository, notificationRepository, currentUserContext);
    }

    @Test
    void directNotificationUsesContextSenderAndExplicitReceiver() {
        UserEntity sender = new UserEntity();
        sender.setId(10L);
        UserEntity receiver = new UserEntity();
        receiver.setId(20L);
        when(currentUserContext.getCurrentUserId()).thenReturn(10L);
        when(userRepository.findById(10L)).thenReturn(Optional.of(sender));
        when(userRepository.findById(20L)).thenReturn(Optional.of(receiver));
        securedService("ADMIN").createNotification(20L, request());
        ArgumentCaptor<NotificationEntity> saved = ArgumentCaptor.forClass(NotificationEntity.class);
        verify(notificationRepository).save(saved.capture());
        assertSame(sender, saved.getValue().getSender());
        assertSame(receiver, saved.getValue().getReceiver());
    }

    @Test
    void systemNotificationDoesNotNeedLoggedInUser() {
        UserEntity receiver = new UserEntity();
        receiver.setId(20L);
        when(userRepository.findById(20L)).thenReturn(Optional.of(receiver));
        service.createSystemNotification(20L, request());
        ArgumentCaptor<NotificationEntity> saved = ArgumentCaptor.forClass(NotificationEntity.class);
        verify(notificationRepository).save(saved.capture());
        assertNull(saved.getValue().getSender());
        assertSame(receiver, saved.getValue().getReceiver());
        verifyNoInteractions(currentUserContext);
    }

    @Test
    void ownerCannotSendToUnrelatedUser() {
        UserEntity sender = new UserEntity();
        sender.setId(10L);
        when(currentUserContext.getCurrentUserId()).thenReturn(10L);
        when(userRepository.findById(10L)).thenReturn(Optional.of(sender));
        NotificationService secured = securedService("OWNER");
        assertThrows(com.javaweb.customException.ForbiddenException.class,
                () -> secured.createOwnerNotification(20L, request()));
        verifyNoInteractions(notificationRepository);
    }

    @Test
    void missingOrInvalidReceiverIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> service.createSystemNotification(null, request()));
        assertThrows(IllegalArgumentException.class,
                () -> service.createSystemNotification(0L, request()));
        verifyNoInteractions(userRepository, notificationRepository);
    }
}
