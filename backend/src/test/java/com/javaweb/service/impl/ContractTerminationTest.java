package com.javaweb.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.javaweb.converter.ContractConverter;
import com.javaweb.customException.ConflictException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.entity.ContractEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.RoomTypeEntity;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ContractStatus;
import com.javaweb.enums.RoomStatus;
import com.javaweb.model.request.NotificationRequest;
import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.RoomRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.NotificationService;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ContractTerminationTest {
    @Mock UserRepository userRepository;
    @Mock RoomRepository roomRepository;
    @Mock ContractRepository contractRepository;
    @Mock NotificationService notificationService;
    // /new/
    @Mock com.javaweb.service.RevenueService revenueService;
    @Mock ContractConverter contractConverter;
    @Mock CurrentUserContext currentUserContext;
    @InjectMocks ContractServiceImpl service;

    private ContractEntity prepareContract(ContractStatus status) {
        UserEntity tenant = new UserEntity();
        tenant.setId(3L);
        RoomEntity room = new RoomEntity();
        room.setId(2L);
        room.setName("A101");
        room.setStatus(RoomStatus.RENTED);
        room.setCurrentTenant(tenant);
        UserEntity owner = new UserEntity();
        owner.setId(4L);
        RentalPropertyEntity property = new RentalPropertyEntity();
        property.setOwner(owner);
        RoomTypeEntity roomType = new RoomTypeEntity();
        roomType.setRentalProperty(property);
        room.setRoomType(roomType);
        ContractEntity contract = new ContractEntity();
        contract.setId(1L);
        contract.setTenant(tenant);
        contract.setRoom(room);
        contract.setStatus(status);
        contract.setEndDate(LocalDate.now().plusMonths(3));
        when(currentUserContext.hasAuthority("ROLE_OWNER")).thenReturn(true);
        when(currentUserContext.getCurrentUserId()).thenReturn(4L);
        when(contractRepository.findRoomIdByContractId(1L)).thenReturn(Optional.of(2L));
        when(roomRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(room));
        when(contractRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(contract));
        return contract;
    }

    @Test
    void approvalRejectsRepeatedApproval() {
        ContractEntity contract = prepareContract(ContractStatus.PENDING);
        // Approval checks the owner id directly; this stub is only used by termination.
        lenient().when(currentUserContext.hasAuthority("ROLE_OWNER")).thenReturn(true);
        contract.getRoom().setStatus(RoomStatus.AVAILABLE);
        contract.getRoom().setCurrentTenant(null);
        when(contractRepository.findAllByRoomIdAndStatusForUpdate(2L, ContractStatus.PENDING))
                .thenReturn(java.util.List.of(contract));

        service.processRentalRequest(1L, ContractStatus.APPROVED, null);
        assertEquals(ContractStatus.APPROVED, contract.getStatus());
        assertThrows(ConflictException.class,
                () -> service.processRentalRequest(1L, ContractStatus.APPROVED, null));
    }

    @Test
    void terminatesContractReleasesRoomAndNotifiesTenant() {
        ContractEntity contract = prepareContract(ContractStatus.APPROVED);
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        service.terminateContract(1L);
        assertEquals(ContractStatus.TERMINATED, contract.getStatus());
        assertEquals(today, contract.getEndDate());
        assertEquals(RoomStatus.AVAILABLE, contract.getRoom().getStatus());
        assertNull(contract.getRoom().getCurrentTenant());
        verify(contractRepository).save(contract);
        verify(roomRepository).save(contract.getRoom());
        ArgumentCaptor<NotificationRequest> notification = ArgumentCaptor.forClass(NotificationRequest.class);
        verify(notificationService).createNotification(eq(3L), notification.capture());
        assertEquals("Hợp đồng đã chấm dứt", notification.getValue().getTitle());
        assertEquals("Hợp đồng #1 của phòng A101 đã chấm dứt vào ngày " + today,
                notification.getValue().getContent());
        assertThrows(ConflictException.class, () -> service.terminateContract(1L));
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void rejectsPendingContractWithoutNotification() {
        ContractEntity contract = prepareContract(ContractStatus.PENDING);
        LocalDate originalEndDate = contract.getEndDate();
        assertThrows(ConflictException.class, () -> service.terminateContract(1L));
        assertEquals(ContractStatus.PENDING, contract.getStatus());
        assertEquals(originalEndDate, contract.getEndDate());
        verifyNoInteractions(notificationService);
    }

    @Test
    void rejectsNonOwnerIncludingAdminBeforeChangingContract() {
        assertThrows(ForbiddenException.class, () -> service.terminateContract(1L));
        verifyNoInteractions(contractRepository, roomRepository, notificationService);
    }

    @Test
    void rejectsAnotherOwnerWithoutChangingContract() {
        ContractEntity contract = prepareContract(ContractStatus.APPROVED);
        when(currentUserContext.getCurrentUserId()).thenReturn(5L);
        assertThrows(ForbiddenException.class, () -> service.terminateContract(1L));
        assertEquals(ContractStatus.APPROVED, contract.getStatus());
        assertEquals(RoomStatus.RENTED, contract.getRoom().getStatus());
        verifyNoInteractions(notificationService);
        verify(contractRepository, never()).save(contract);
    }
}
