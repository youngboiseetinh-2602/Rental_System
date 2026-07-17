package com.javaweb.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.javaweb.enums.ContractStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContractResponse {

    private Long id;

    private Long roomId;

    private String roomName;

    private Long tenantId;

    private String tenantName;

    private LocalDate startDate;

    private LocalDate endDate;

    private ContractStatus status;

    private LocalDateTime createdAt;
}
