package com.javaweb.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.javaweb.converter.ContractConverter;
import com.javaweb.converter.ContractSearchBuilderConverter;
import com.javaweb.builder.ContractSearchBuilder;
import com.javaweb.converter.UserConverter;
import com.javaweb.converter.UserSearchBuilderConverter;
import com.javaweb.repository.ContractRepository;
import com.javaweb.repository.RentalPropertyRepository;
import com.javaweb.repository.RentalTypeRepository;
import com.javaweb.repository.UserRepository;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class AdminContractDashboardTest {

    @Mock UserRepository userRepository;
    @Mock UserConverter userConverter;
    @Mock UserSearchBuilderConverter userSearchBuilderConverter;
    @Mock RentalTypeRepository rentalTypeRepository;
    @Mock RentalPropertyRepository rentalPropertyRepository;
    @Mock ModelMapper modelMapper;
    @Mock ContractRepository contractRepository;
    @Mock ContractConverter contractConverter;

    private AdminServiceImpl service() {
        return new AdminServiceImpl(userRepository, userConverter,
                userSearchBuilderConverter, rentalTypeRepository,
                rentalPropertyRepository, modelMapper, contractRepository,
                contractConverter, new ContractSearchBuilderConverter());
    }

    private void emptyPage() {
        when(contractRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenAnswer(invocation -> Page.empty(invocation.getArgument(1)));
    }

    @Test
    void defaultsToCurrentMonthAndPaginatesNewestFirst() {
        emptyPage();
        service().contractDashboard(Map.of(), PageRequest.of(2, 50));
        ContractSearchBuilder search = new ContractSearchBuilderConverter()
                .toContractSearchBuilder(Map.of());
        YearMonth currentMonth = YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        assertEquals(currentMonth, search.getFrom());
        assertEquals(currentMonth.plusMonths(1), search.getTo());
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(contractRepository).findAll(any(Specification.class), page.capture());
        assertEquals(2, page.getValue().getPageNumber());
        assertEquals(10, page.getValue().getPageSize());
        assertEquals(Sort.Direction.DESC, page.getValue().getSort().getOrderFor("createdAt").getDirection());
        assertEquals(Sort.Direction.DESC, page.getValue().getSort().getOrderFor("id").getDirection());
    }

    @Test
    void resolvesOpenMonthRanges() {
        ContractSearchBuilderConverter converter = new ContractSearchBuilderConverter();
        ContractSearchBuilder fromStart = converter.toContractSearchBuilder(Map.of("to", "2025-06"));
        assertNull(fromStart.getFrom());
        assertEquals(YearMonth.of(2025, 6), fromStart.getTo());

        ContractSearchBuilder toCurrent = converter.toContractSearchBuilder(Map.of("from", "2025-06"));
        assertEquals(YearMonth.of(2025, 6), toCurrent.getFrom());
        assertEquals(YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusMonths(1), toCurrent.getTo());
    }

    @Test
    void rejectsInvalidRange() {
        assertThrows(IllegalArgumentException.class, () ->
                new ContractSearchBuilderConverter().toContractSearchBuilder(
                        Map.of("from", "2026-10", "to", "2026-09")));
        assertThrows(IllegalArgumentException.class, () ->
                new ContractSearchBuilderConverter().toContractSearchBuilder(
                        Map.of("from", "2026-07", "to", "2026-07")));
    }
}
