package com.javaweb.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.javaweb.converter.ContractConverter;
import com.javaweb.entity.ContractEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ContractStatus;
import com.javaweb.enums.RoomStatus;
import com.javaweb.enums.UserRole;
import com.javaweb.model.request.RentalRequest;
import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.RoomRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.NotificationService;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ContractServiceImplTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final RoomRepository roomRepository = mock(RoomRepository.class);
    private final ContractRepository contractRepository = mock(ContractRepository.class);
    private final NotificationService notificationService = mock(NotificationService.class);
    private final ContractConverter contractConverter = mock(ContractConverter.class);
    private final CurrentUserContext currentUserContext = mock(CurrentUserContext.class);

    private final ContractServiceImpl contractService = new ContractServiceImpl(
            userRepository,
            roomRepository,
            contractRepository,
            notificationService,
            contractConverter,
            currentUserContext
    );

    @Test
    void createsNewPendingContractWithoutCopyingRoomIdToContractId() {
        UserEntity customer = new UserEntity();
        customer.setId(5L);
        customer.setRole(UserRole.CUSTOMER);

        RoomEntity room = new RoomEntity();
        room.setId(19L);
        room.setStatus(RoomStatus.AVAILABLE);

        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate endDate = LocalDate.of(2027, 7, 31);
        RentalRequest request = new RentalRequest();
        request.setRoomId(19L);
        request.setStartDate(startDate);
        request.setEndDate(endDate);

        when(currentUserContext.getCurrentUserId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(customer));
        when(roomRepository.findByIdForUpdate(19L)).thenReturn(Optional.of(room));
        when(contractRepository.existsByTenant_IdAndRoom_IdAndStatus(
                5L, 19L, ContractStatus.PENDING)).thenReturn(false);
        when(contractRepository.save(any(ContractEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String result = contractService.createRentalRequest(request);

        ArgumentCaptor<ContractEntity> captor = ArgumentCaptor.forClass(ContractEntity.class);
        verify(contractRepository).save(captor.capture());
        ContractEntity savedContract = captor.getValue();

        assertNull(savedContract.getId());
        assertSame(customer, savedContract.getTenant());
        assertSame(room, savedContract.getRoom());
        assertEquals(startDate, savedContract.getStartDate());
        assertEquals(endDate, savedContract.getEndDate());
        assertEquals(ContractStatus.PENDING, savedContract.getStatus());
        assertEquals("gui yeu cau thue thanh cong , cho thong bao tu chu tro", result);
    }
}
