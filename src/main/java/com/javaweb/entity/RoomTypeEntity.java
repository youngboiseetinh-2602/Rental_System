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
import java.math.BigDecimal;
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
@Table(name = "room_type")
@BatchSize(size = 50)
public class RoomTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rentalPropertyId", nullable = false)
    private RentalPropertyEntity rentalProperty;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(precision = 8, scale = 2)
    private BigDecimal area;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPrice;

    private Integer maxGuests;

    @OneToMany(mappedBy = "roomType", cascade = CascadeType.ALL)
    @BatchSize(size = 50)
    private List<FacilityEntity> facilities = new ArrayList<>();

    @OneToMany(mappedBy = "roomType", cascade = CascadeType.ALL)
    @BatchSize(size = 50)
    private List<RoomEntity> rooms = new ArrayList<>();
}
