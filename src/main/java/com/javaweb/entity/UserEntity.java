package com.javaweb.entity;

import com.javaweb.enums.UserGender;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
@BatchSize(size = 50)
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(length = 20)
    private String phoneNumber;

    @Column(nullable = false)
    private String password;

    @Column(name = "citizenId", unique = true, length = 12)
    private String citizenCode;

    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('MALE','FEMALE')")
    private UserGender gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('ADMIN','OWNER','CUSTOMER')")
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('ACTIVE','INACTIVE','LOCKED')")
    private UserStatus status = UserStatus.ACTIVE;

    @OneToMany(mappedBy = "owner")
    @BatchSize(size = 50)
    private List<RentalPropertyEntity> rentalProperties = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    @BatchSize(size = 50)
    private List<ReviewEntity> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "currentTenant")
    @BatchSize(size = 50)
    private List<RoomEntity> currentRooms = new ArrayList<>();

    @OneToMany(mappedBy = "tenant")
    @BatchSize(size = 50)
    private List<ContractEntity> contracts = new ArrayList<>();

    @OneToMany(mappedBy = "sender")
    @BatchSize(size = 50)
    private List<NotificationEntity> sentNotifications = new ArrayList<>();

    @OneToMany(mappedBy = "receiver")
    @BatchSize(size = 50)
    private List<NotificationEntity> receivedNotifications = new ArrayList<>();

    @OneToMany(mappedBy = "owner")
    @BatchSize(size = 50)
    private List<ConversationEntity> ownerConversations = new ArrayList<>();

    @OneToMany(mappedBy = "customer")
    @BatchSize(size = 50)
    private List<ConversationEntity> customerConversations = new ArrayList<>();

    @OneToMany(mappedBy = "sender")
    @BatchSize(size = 50)
    private List<MessageEntity> messages = new ArrayList<>();
}
