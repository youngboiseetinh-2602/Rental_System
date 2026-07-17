package com.javaweb.service.impl;

import com.javaweb.customException.ConflictException;
import com.javaweb.customException.DataNotFoundException;
import com.javaweb.customException.ForbiddenException;
import com.javaweb.converter.ContractConverter;
import com.javaweb.entity.ContractEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.UserEntity;
import com.javaweb.enums.ContractStatus;
import com.javaweb.enums.RoomStatus;
import com.javaweb.enums.UserRole;
import com.javaweb.model.request.RentalRequest;
import com.javaweb.model.request.NotificationRequest;
import com.javaweb.model.response.ContractResponse;
import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.RoomRepository;
import com.javaweb.repository.UserRepository;
import com.javaweb.service.ContractService;
import com.javaweb.service.NotificationService;
import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final ContractRepository contractRepository;
    private final NotificationService notificationService;
    private final ContractConverter contractConverter;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public String createRentalRequest(Long userId, RentalRequest request) {
        UserEntity customer = getCustomer(userId);
        RoomEntity room = getAvailableRoom(request.getRoomId());
        checkDuplicateRequest(userId, room.getId());

        contractRepository.save(toPendingContract(customer, room, request));

        return "gui yeu cau thue thanh cong , cho thong bao tu chu tro";
    }

    @Override
    @Transactional
    public String processRentalRequest(Long contractId, ContractStatus status) {
        ContractEntity contract = getPendingContract(contractId);

        // Owner tu choi yeu cau.
        if (status == ContractStatus.CANCELLED) {
            String result = cancelContract(contract);
            sendRejectedNotification(contract);
            return result;
        }
        if (status != ContractStatus.APPROVED) {
            throw new IllegalArgumentException("Status must be APPROVED or CANCELLED");
        }

        return approveContract(contract);
    }

    @Override
    @Transactional
    public String cancelRentalRequest(Long userId, Long contractId) {
        ContractEntity contract = getPendingContract(contractId);

        if (!contract.getTenant().getId().equals(userId)) {
            throw new ForbiddenException("You are not allowed to cancel this rental request");
        }

        return cancelContract(contract);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractResponse> getUserRentalRequests(Long userId) {
        getCustomer(userId);
        List<ContractEntity> requests =
                contractRepository.findAllByTenant_Id(userId);

        if (requests.isEmpty()) {
            throw new DataNotFoundException("khong tim thay yeu cau thue nao");
        }

        List<ContractResponse> responses = new ArrayList<>();
        for (ContractEntity request : requests) {
            responses.add(contractConverter.toContractResponse(request));
        }
        return responses;
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void notifyContractsExpiringInOneWeek() {
        LocalDate expiryDate = LocalDate.now(VIETNAM_ZONE).plusWeeks(1);
        contractRepository.findAllByStatusAndEndDate(ContractStatus.APPROVED, expiryDate)
                .forEach(this::sendContractExpiryNotification);
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Ho_Chi_Minh")
    public void expireContracts() {
        LocalDate today = LocalDate.now(VIETNAM_ZONE);
        List<ContractEntity> expiredContracts =
                contractRepository.findAllByStatusAndEndDateBefore(
                        ContractStatus.APPROVED, today);

        for (ContractEntity contract : expiredContracts) {
            RoomEntity room = contract.getRoom();
            contract.setStatus(ContractStatus.EXPIRED);
            room.setStatus(RoomStatus.AVAILABLE);
            room.setCurrentTenant(null);

            contractRepository.save(contract);
            roomRepository.save(room);
        }
    }

    private UserEntity getCustomer(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException("User not found: " + userId));
        if (user.getRole() != UserRole.CUSTOMER) {
            throw new ForbiddenException("Only customers can create rental requests");
        }
        return user;
    }

    private RoomEntity getAvailableRoom(Long roomId) {
        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new DataNotFoundException("Room not found: " + roomId));
        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ConflictException("Room is not available");
        }
        return room;
    }

    private void checkDuplicateRequest(Long userId, Long roomId) {
        boolean exists = contractRepository.existsByTenant_IdAndRoom_IdAndStatus(
                userId, roomId, ContractStatus.PENDING);
        if (exists) {
            throw new ConflictException("A pending request already exists for this room");
        }
    }

    private ContractEntity toPendingContract(
            UserEntity customer, RoomEntity room, RentalRequest request) {
        ContractEntity contract = modelMapper.map(request, ContractEntity.class);
        contract.setTenant(customer);
        contract.setRoom(room);
        contract.setStatus(ContractStatus.PENDING);
        return contract;
    }

    private String approveContract(ContractEntity contract) {
        RoomEntity room = getAvailableRoom(contract.getRoom().getId());

        contract.setStatus(ContractStatus.APPROVED);
        room.setStatus(RoomStatus.RENTED);
        room.setCurrentTenant(contract.getTenant());

        // Mot phong chi co mot hop dong duoc duyet.
        contractRepository.findAllByRoom_IdAndStatus(room.getId(), ContractStatus.PENDING)
                .stream()
                .filter(item -> !item.getId().equals(contract.getId()))
                .forEach(item -> item.setStatus(ContractStatus.CANCELLED));

        contractRepository.save(contract);
        roomRepository.save(room);
        sendApprovedNotification(contract);
        return "chap nhan yeu cau thue thanh cong";
    }

    private String cancelContract(ContractEntity contract) {
        contract.setStatus(ContractStatus.CANCELLED);
        contractRepository.save(contract);
        return "huy yeu cau thue thanh cong";
    }

    private ContractEntity getPendingContract(Long contractId) {
        ContractEntity contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Rental request not found with id: " + contractId));

        if (contract.getStatus() != ContractStatus.PENDING) {
            throw new ConflictException("Rental request is no longer pending");
        }

        return contract;
    }

    private void sendApprovedNotification(ContractEntity contract) {
        sendNotification(
                contract,
                "Yeu cau thue da duoc chap nhan",
                "Yeu cau thue phong " + contract.getRoom().getName()
                        + " da duoc chu tro chap nhan",
                false);
    }

    private void sendRejectedNotification(ContractEntity contract) {
        sendNotification(
                contract,
                "Yeu cau thue da bi tu choi",
                "Yeu cau thue phong " + contract.getRoom().getName()
                        + " da bi chu tro tu choi",
                false);
    }

    private void sendContractExpiryNotification(ContractEntity contract) {
        String title = "Hop dong sap het han";
        String content = "Hop dong #" + contract.getId()
                + " cua phong " + contract.getRoom().getName()
                + " se het han vao ngay " + contract.getEndDate();

        sendNotification(contract, title, content, true);
    }

    private void sendNotification(
            ContractEntity contract, String title, String content, boolean checkDuplicate) {
        Long receiverId = contract.getTenant().getId();
        if (checkDuplicate && notificationService.notificationExists(
                receiverId, title, content)) {
            return;
        }

        NotificationRequest request = new NotificationRequest();
        request.setReceiverId(receiverId);
        request.setTitle(title);
        request.setContent(content);
        notificationService.createNotification(getOwnerId(contract), request);
    }

    private Long getOwnerId(ContractEntity contract) {
        return contract.getRoom().getRoomType().getRentalProperty().getOwner().getId();
    }
}
