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
        Long userId = currentUserContext.getCurrentUserId();
        UserEntity customer = getCustomer(userId);
        RoomEntity room = getAvailableRoomForUpdate(request.getRoomId());
        checkDuplicateRequest(userId, room.getId());
        contractRepository.save(toPendingContract(customer, room, request));
        return "Gửi yêu cầu thuê thành công, vui lòng chờ thông báo từ chủ trọ";
    }

    @Override
    @PreAuthorize(AuthorizationRules.OWNER_OR_ADMIN)
    @Transactional
    public String processRentalRequest(
            Long contractId, ContractStatus status, String rejectionReason) {
        if (status != ContractStatus.APPROVED && status != ContractStatus.CANCELLED) {
            throw new IllegalArgumentException("Trạng thái phải là APPROVED hoặc CANCELLED");
        }
        String normalizedReason = normalizeRejectionReason(status, rejectionReason);
        Long roomId = getContractRoomId(contractId);
        RoomEntity room = getRoomForUpdate(roomId);
        ContractEntity contract = getPendingContractForUpdate(contractId);
        checkOwnerAccess(contract);
        if (status == ContractStatus.CANCELLED) {
            String result = cancelContract(contract);
            sendRejectedNotification(contract, normalizedReason);
            return result;
        }
        return approveContract(contract, room);
    }

    @Override
    @PreAuthorize(AuthorizationRules.CUSTOMER)
    @Transactional
    public String cancelRentalRequest(Long contractId) {
        Long userId = currentUserContext.getCurrentUserId();
        Long roomId = getContractRoomId(contractId);
        getRoomForUpdate(roomId);
        ContractEntity contract = getPendingContractForUpdate(contractId);
        if (!contract.getTenant().getId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền hủy yêu cầu thuê này");
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
            throw new ConflictException("Chỉ có thể kết thúc hợp đồng đã được chấp nhận");
        }

        contract.setStatus(ContractStatus.TERMINATED);
        contract.setEndDate(LocalDate.now(VIETNAM_ZONE));
        room.setStatus(RoomStatus.AVAILABLE);
        room.setCurrentTenant(null);

        contractRepository.save(contract);
        roomRepository.save(room);
        return "Kết thúc hợp đồng thành công";
    }

    @Override
    @PreAuthorize(AuthorizationRules.CUSTOMER)
    @Transactional(readOnly = true)
    public List<ContractResponse> getUserRentalRequests() {
        Long userId = currentUserContext.getCurrentUserId();
        getCustomer(userId);
        List<ContractEntity> contractEntities =
                contractRepository.findAllByTenant_Id(userId);

        if (contractEntities.isEmpty()) {
            throw new DataNotFoundException("Không tìm thấy yêu cầu thuê nào");
        }

        List<ContractResponse> results = new ArrayList<>();

        for (ContractEntity contractEntity : contractEntities) {
            results.add(contractConverter.toContractResponse(contractEntity));
        }

        return results;
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
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy người dùng: " + userId));
        if (user.getRole() != UserRole.CUSTOMER) {
            throw new ForbiddenException("Chỉ khách hàng mới có thể tạo yêu cầu thuê");
        }
        return user;
    }

    // Khoa phong lam mutex nghiep vu cho moi thay doi request cua phong do.
    private RoomEntity getRoomForUpdate(Long roomId) {
        RoomEntity room = roomRepository.findByIdForUpdate(roomId)
                .orElseThrow(() -> new DataNotFoundException("Không tìm thấy phòng: " + roomId));
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
            throw new ConflictException("Phòng hiện không còn trống");
        }
    }

    private void checkDuplicateRequest(Long userId, Long roomId) {
        boolean exists = contractRepository.existsByTenant_IdAndRoom_IdAndStatus(
                userId, roomId, ContractStatus.PENDING);
        if (exists) {
            throw new ConflictException("Bạn đã có một yêu cầu đang chờ xử lý cho phòng này");
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
            throw new ConflictException("Yêu cầu thuê đã hết hạn");
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
                        "Yêu cầu thuê không còn ở trạng thái chờ xử lý"));
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
        return "Chấp nhận yêu cầu thuê thành công";
    }

    private String cancelContract(ContractEntity contract) {
        contract.setStatus(ContractStatus.CANCELLED);
        contractRepository.save(contract);
        return "Hủy yêu cầu thuê thành công";
    }

    private Long getContractRoomId(Long contractId) {
        return contractRepository.findRoomIdByContractId(contractId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy hợp đồng có mã: " + contractId));
    }

    private ContractEntity getContractForUpdate(Long contractId) {
        return contractRepository.findByIdForUpdate(contractId)
                .orElseThrow(() -> new DataNotFoundException(
                        "Không tìm thấy hợp đồng có mã: " + contractId));
    }

    // Khoa request de viec huy va duyet khong the cap nhat cung luc.
    private ContractEntity getPendingContractForUpdate(Long contractId) {
        ContractEntity contract = getContractForUpdate(contractId);

        if (contract.getStatus() != ContractStatus.PENDING) {
            throw new ConflictException("Yêu cầu thuê không còn ở trạng thái chờ xử lý");
        }

        return contract;
    }

    private void sendApprovedNotification(ContractEntity contract) {
        sendNotification(
                contract,
                "Yêu cầu thuê đã được chấp nhận",
                "Yêu cầu thuê phòng " + contract.getRoom().getName()
                        + " đã được chủ trọ chấp nhận");
    }

    private void sendRejectedNotification(
            ContractEntity contract, String rejectionReason) {
        sendNotification(
                contract,
                "Yêu cầu thuê đã bị từ chối",
                "Yêu cầu thuê phòng " + contract.getRoom().getName()
                        + " đã bị chủ trọ từ chối. Lý do: " + rejectionReason);
    }

    private String normalizeRejectionReason(
            ContractStatus status, String rejectionReason) {
        if (status != ContractStatus.CANCELLED) {
            return null;
        }
        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập lý do từ chối");
        }
        String normalizedReason = rejectionReason.trim();
        if (normalizedReason.length() > 500) {
            throw new IllegalArgumentException(
                    "Lý do từ chối không được vượt quá 500 ký tự");
        }
        return normalizedReason;
    }

    private void sendContractExpiryNotification(ContractEntity contract) {
        String title = "Hợp đồng sắp hết hạn";
        String content = "Hợp đồng #" + contract.getId()
                + " của phòng " + contract.getRoom().getName()
                + " sẽ hết hạn vào ngày " + contract.getEndDate();

        sendSystemNotification(contract, title, content);
    }

    private void sendNotification(
            ContractEntity contract, String title, String content) {
        Long receiverId = contract.getTenant().getId();
        NotificationRequest request = new NotificationRequest();
        request.setReceiverId(receiverId);
        request.setTitle(title);
        request.setContent(content);
        notificationService.createNotification(getOwnerId(contract), request);
    }

    private void sendSystemNotification(
            ContractEntity contract, String title, String content) {
        NotificationRequest request = new NotificationRequest();
        request.setReceiverId(contract.getTenant().getId());
        request.setTitle(title);
        request.setContent(content);
        notificationService.createSystemNotification(request);
    }

    private Long getOwnerId(ContractEntity contract) {
        return contract.getRoom().getRoomType().getRentalProperty().getOwner().getId();
    }

    private void checkOwnerAccess(ContractEntity contract) {
        if (!getOwnerId(contract).equals(
                currentUserContext.getCurrentUserId())
                && !currentUserContext.hasAuthority("ROLE_ADMIN")) {
            throw new ForbiddenException("Bạn không có quyền xử lý yêu cầu thuê này");
        }
    }

    private void checkAdminAccess() {
        if (!currentUserContext.hasAuthority("ROLE_ADMIN")) {
            throw new ForbiddenException("Chỉ quản trị viên mới có thể kết thúc hợp đồng");
        }
    }

}
