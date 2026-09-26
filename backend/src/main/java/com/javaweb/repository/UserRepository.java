package com.javaweb.repository;

import com.javaweb.entity.UserEntity;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import com.javaweb.enums.UserRole;
import com.javaweb.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<UserEntity, Long>,
        JpaSpecificationExecutor<UserEntity> {

    // /new/
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    // /new/
    @Query("select u from UserEntity u where u.id = :id")
    Optional<UserEntity> findByIdForRevenueUpdate(@Param("id") Long id);

    // /new/
    @Query("select u.id from UserEntity u where u.role = com.javaweb.enums.UserRole.OWNER order by u.id")
    List<Long> findOwnerIds();

    // /new/
    @Query("""
            select u from UserEntity u
            left join MonthlyRevenueEntity r on r.user = u and r.year = :year and r.month = :month
            where u.role = com.javaweb.enums.UserRole.OWNER and r.id is null
            order by u.id
            """)
    List<UserEntity> findOwnersMissingRevenue(@Param("year") Short year, @Param("month") Byte month);

    boolean existsByUsername(String username);

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findFirstByRoleAndStatusOrderByIdAsc(
            UserRole role,
            UserStatus status);

    boolean existsByCitizenCode(String citizenCode);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);
}
