package com.javaweb.specification;

import com.javaweb.builder.RentalSearchBuilder;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RoomTypeEntity;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class RentalPropertySpecification {

    private RentalPropertySpecification() {
    }

    public static Specification<RentalPropertyEntity> search(RentalSearchBuilder searchBuilder) {
        return (root, query, criteriaBuilder) -> {
            if (searchBuilder == null || searchBuilder.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(searchBuilder.getRentalType())) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("rentalType").get("name")),
                        contains(searchBuilder.getRentalType())));
            }
            addLike(predicates, criteriaBuilder, root.get("city"), searchBuilder.getCity());
            addLike(predicates, criteriaBuilder, root.get("ward"), searchBuilder.getWard());
            addLike(predicates, criteriaBuilder, root.get("street"), searchBuilder.getStreet());

            if (searchBuilder.getMinPrice() != null || searchBuilder.getMaxPrice() != null) {
                Join<RentalPropertyEntity, RoomTypeEntity> roomType = root.join("roomTypes");
                if (searchBuilder.getMinPrice() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                            roomType.get("monthlyPrice"), searchBuilder.getMinPrice()));
                }
                if (searchBuilder.getMaxPrice() != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(
                            roomType.get("monthlyPrice"), searchBuilder.getMaxPrice()));
                }
                query.distinct(true);
            }

            if (predicates.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static void addLike(
            List<Predicate> predicates,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            jakarta.persistence.criteria.Path<String> path,
            String value
    ) {
        if (StringUtils.hasText(value)) {
            predicates.add(criteriaBuilder.like(criteriaBuilder.lower(path), contains(value)));
        }
    }

    private static String contains(String value) {
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
    }
}
