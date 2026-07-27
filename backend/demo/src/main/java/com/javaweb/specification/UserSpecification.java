package com.javaweb.specification;

import com.javaweb.builder.UserSearchBuilder;
import com.javaweb.entity.UserEntity;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class UserSpecification {

    private UserSpecification() {
    }

    public static Specification<UserEntity> search(UserSearchBuilder searchBuilder) {
        return (root, query, criteriaBuilder) -> {
            if (searchBuilder == null || searchBuilder.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            if (searchBuilder.getRole() != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("role"), searchBuilder.getRole()));
            }
            if (searchBuilder.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("status"), searchBuilder.getStatus()));
            }
            if (StringUtils.hasText(searchBuilder.getCitizenCode())) {
                predicates.add(criteriaBuilder.like(
                        root.get("citizenCode"),
                        "%" + searchBuilder.getCitizenCode().trim() + "%"));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
