package com.javaweb.specification;

import com.javaweb.builder.ContractSearchBuilder;
import com.javaweb.entity.ContractEntity;
import com.javaweb.enums.ContractStatus;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class ContractSpecification {

    private ContractSpecification() {
    }

    public static Specification<ContractEntity> search(ContractSearchBuilder search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(root.get("status").in(
                    ContractStatus.APPROVED,
                    ContractStatus.TERMINATED,
                    ContractStatus.EXPIRED));
            if (search.getTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("startDate"), search.getTo().atEndOfMonth()));
            }
            if (search.getFrom() != null) {
                LocalDate monthStart = search.getFrom().atDay(1);
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.isNull(root.get("endDate")),
                        criteriaBuilder.greaterThanOrEqualTo(
                                root.get("endDate"), monthStart)));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

}
