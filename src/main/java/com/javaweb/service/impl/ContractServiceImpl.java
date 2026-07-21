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
import com.javaweb.security.AuthorizationRules;
import com.javaweb.security.CurrentUserContext;
import com.javaweb.service.ContractService;
import com.javaweb.service.NotificationService;
import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final CurrentUserContext currentUserContext;

    @Override
    @PreAuthorize(AuthorizationRules.CUSTOMER)
    @Transactional
    public String createRentalRequest(RentalRequest request) {
        Long userId = getCurrentUserId();
        UserEntity customer = getCustomer(userId);
        RoomEntity room = getAvailableRoomForUpdate(request.getRoomId());
        checkDuplicateRequest(userId, room.getId());

        contractRepository.save(toPendingContract(customer, room, request));

        return "gui yeu cau thue thanh cong , cho thong bao tu chu tro";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String processRentalRequest(Long contractId, ContractStatus status) {
        if (status != ContractStatus.APPROVED && status != ContractStatus.CANCELLED) {
            throw new IllegalArgumentException("Status must be APPROVED or CANCELLED");
        }

        Long roomId = getContractRoomId(contractId);
        RoomEntity room = getRoomForUpdate(roomId);
        ContractEntity contract = getPendingContractForUpdate(contractId);
        checkOwnerAccess(contract);

        if (status == ContractStatus.CANCELLED) {
            String result = cancelContract(contract);
            sendRejectedNotification(contract);
            return result;
        }

        return approveContract(contract, room);
    }

    @Override
    @PreAuthorize(AuthorizationRules.CUSTOMER)
    @Transactional
    public String cancelRentalRequest(Long contractId) {
        Long userId = getCurrentUserId();
        Long roomId = getContractRoomId(contractId);
        getRoomForUpdate(roomId);
        ContractEntity contract = getPendingContractForUpdate(contractId);

        if (!contract.getTenant().getId().equals(userId)) {
            throw new ForbiddenException("You are not allowed to cancel this rental request");
        }

        return cancelContract(contract);
    }

    @Override
    @PreAuthorize(AuthorizationRules.ADMIN)
    @Transactional
    public String terminateContract(Long contractId) {
        checkAdminAccess();

        Long roomId = getContractRoomId(contractId);
        RoomEntity room = getRoomForUpdate(roomId);
        ContractEntity contract = getContractForUpdate(contractId);

        if (contract.getStatus() != ContractStatus.APPROVED) {
            throw new ConflictException("Only approved contracts can be terminated");
        }

        contract.setStatus(ContractStatus.TERMINATED);
        contract.setEndDate(LocalDate.now(VIETNAM_ZONE));
        room.setStatus(RoomStatus.AVAILABLE);
        room.setCurrentTenant(null);

        contractRepository.save(contract);
        roomRepository.save(room);
        return "ket thuc hop dong thanh cong";
    }

    @Override
    @PreAuthorize(AuthorizationRules.CUSTOMER)
    @Transactional(readOnly = true)
    public List<ContractResponse> getUserRentalRequests() {
        Long userId = getCurrentUserId();
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
        List<Long> expiredContractIds =
                contractRepository.findIdsByStatusAndEndDateBefore(
                        ContractStatus.APPROVED, today);

        for (Long contractId : expiredContractIds) {
            Long roomId = contractRepository.findRoomIdByContractId(contractId)
                    .orElse(null);
            if (roomId == null) {
                continue;
            }
            RoomEntity room = roomRepository.findByIdForUpdate(roomId)
                    .orElse(null);
            if (room == null) {
                continue;
            }
            ContractEntity contract = contractRepository.findByIdForUpdate(contractId)
                    .orElse(null);
            if (contract == null
                    || contract.getStatus() != ContractStatus.APPROVED
                    || contract.getEndDate() == null
                    || !contract.getEndDate().isBefore(today)) {
                continue;
            }
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

    // Khoa phong lam mutex nghiep vu cho moi thay doi request cua phong do.
    private RoomEntity getRoomForUpdate(Long roomId) {
        RoomEntity room = roomRepository.findByIdForUpdate(roomId)
                .orElseThrow(() -> new DataNotFoundException("Room not found: " + roomId));
        return room;
    }

    // Khoa phong roi kiem tra trang thai hien tai, khong dung du lieu snapshot cu.
    private RoomEntity getAvailableRoomForUpdate(Long roomId) {
        RoomEntity room = getRoomForUpdate(roomId);
        checkRoomAvailable(room);
        return room;
    }

    private void checkRoomAvailable(RoomEntity room) {
        if (room.getStatus() != RoomStatus.AVAILABLE || room.getCurrentTenant() != null) {
            throw new ConflictException("Room is not available");
        }
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
        ContractEntity contract = new ContractEntity();
        contract.setTenant(customer);
        contract.setRoom(room);
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setStatus(ContractStatus.PENDING);
        return contract;
    }

    // Phong da duoc khoa truoc; cac request PENDING duoc khoa theo id tang dan.
    private String approveContract(ContractEntity selectedContract, RoomEntity room) {
        if (selectedContract.getEndDate() == null
                || !selectedContract.getEndDate().isAfter(LocalDate.now(VIETNAM_ZONE))) {
            throw new ConflictException("Rental request has expired");
        }
        checkRoomAvailable(room);
        List<ContractEntity> pendingContracts =
                contractRepository.findAllByRoomIdAndStatusForUpdate(
                        room.getId(),
                        ContractStatus.PENDING
                );

        ContractEntity contract = pendingContracts.stream()
                .filter(item -> item.getId().equals(selectedContract.getId()))
                .findFirst()
                .orElseThrow(() -> new ConflictException(
                        "Rental request is no longer pending"));
        checkOwnerAccess(contract);

        contract.setStatus(ContractStatus.APPROVED);
        room.setStatus(RoomStatus.RENTED);
        room.setCurrentTenant(contract.getTenant());

        // Mot phong chi co mot hop dong duoc duyet.
        pendingContracts.stream()
                .filter(item -> !item.getId().equals(contract.getId()))
                .forEach(item -> item.setStatus(ContractStatus.CANCELLED));

        contractRepository.saveAll(pendingContracts);
        roomRepository.save(room);
        sendApprovedNotification(contract);
        return "chap nhan yeu cau thue thanh cong";
    }

    private String cancelContract(ContractEntity contract) {
        contract.setStatus(ContractStatus.CANCELLED);
        contractRepository.save(contract);
        return "huy yeu cau thue thanh cong";
    }

    private Long getContractRoomId(Long contractId) {
        return contractRepository.findRoomIdByContractId(contractId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Contract not found with id: " + contractId));
    }

    private ContractEntity getContractForUpdate(Long contractId) {
        return contractRepository.findByIdForUpdate(contractId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Contract not found with id: " + contractId));
    }

    // Khoa request de viec huy va duyet khong the cap nhat cung luc.
    private ContractEntity getPendingContractForUpdate(Long contractId) {
        ContractEntity contract = getContractForUpdate(contractId);

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

    private void checkOwnerAccess(ContractEntity contract) {
        if (!getOwnerId(contract).equals(getCurrentUserId())
                && !currentUserContext.hasAuthority("ROLE_ADMIN")) {
            throw new ForbiddenException("You are not allowed to process this rental request");
        }
    }

    private void checkAdminAccess() {
        if (!currentUserContext.hasAuthority("ROLE_ADMIN")) {
            throw new ForbiddenException("Only administrators can terminate contracts");
        }
    }

    private Long getCurrentUserId() {
        return currentUserContext.getCurrentUserId();
    }
}
