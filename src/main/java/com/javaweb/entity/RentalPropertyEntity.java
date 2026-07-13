package com.javaweb.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "rental_property")
@BatchSize(size = 50)
public class RentalPropertyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ownerId", nullable = false)
    private UserEntity owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rentalTypeId", nullable = false)
    private RentalTypeEntity rentalType;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String ward;

    @Column(length = 100)
    private String street;

    @Column(length = 50)
    private String houseNumber;

    private String detailedAddress;

    @Column(columnDefinition = "TEXT")
    private String houseRules;

    @OneToMany(mappedBy = "rentalProperty", cascade = CascadeType.ALL)
    @BatchSize(size = 50)
    private List<ImageEntity> images = new ArrayList<>();

    @OneToMany(mappedBy = "rentalProperty")
    @BatchSize(size = 50)
    private List<ReviewEntity> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "rentalProperty", cascade = CascadeType.ALL)
    @BatchSize(size = 50)
    private List<RoomTypeEntity> roomTypes = new ArrayList<>();

    @OneToMany(mappedBy = "rentalProperty")
    @BatchSize(size = 50)
    private List<NotificationDetailEntity> notificationDetails = new ArrayList<>();
}
