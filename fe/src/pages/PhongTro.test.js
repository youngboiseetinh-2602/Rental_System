import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import PhongTro from './PhongTro';
import { searchRentalProperties } from '../services/rentalService';

jest.mock('../services/rentalService', () => {
    const actual = jest.requireActual('../services/rentalService');
    return {
        ...actual,
        searchRentalProperties: jest.fn(),
    };
});

describe('trang Phòng trọ', () => {
    let container;
    let root;
    const originalActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;

    beforeAll(() => {
        global.IS_REACT_ACT_ENVIRONMENT = true;
    });

    beforeEach(() => {
        searchRentalProperties.mockReset();
        searchRentalProperties.mockResolvedValue({
            content: [{
                id: 1,
                name: 'Nhà trọ API',
                city: 'Hà Nội',
                rentalTypeName: 'studio',
            }],
            totalElements: 1,
        });
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    afterAll(() => {
        global.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    });

    it('gọi map rỗng lúc mở trang và chỉ gọi lại khi bấm Áp dụng', async () => {
        await act(async () => {
            root.render(<PhongTro />);
        });

        expect(searchRentalProperties).toHaveBeenCalledTimes(1);
        expect(searchRentalProperties).toHaveBeenLastCalledWith({
            page: 0,
            size: 10,
        });
        expect(container.textContent).toContain('Nhà trọ API');

        const city = container.querySelector('[name="city"]');
        const description = container.querySelector('[name="searchText"]');
        act(() => {
            Simulate.change(city, {
                target: {
                    name: 'city',
                    value: 'Hà Nội',
                },
            });
        });
        act(() => {
            Simulate.change(description, {
                target: {
                    name: 'searchText',
                    value: 'nội thất',
                },
            });
        });

        expect(searchRentalProperties).toHaveBeenCalledTimes(1);

        const applyButton = [...container.querySelectorAll('button')]
            .find((button) => button.textContent.trim() === 'Áp dụng');
        await act(async () => {
            applyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(searchRentalProperties).toHaveBeenCalledTimes(2);
        expect(searchRentalProperties).toHaveBeenLastCalledWith({
            description: 'nội thất',
            city: 'Hà Nội',
            page: 0,
            size: 10,
        });
    });

    it('xóa bộ lọc và gọi lại API với map rỗng', async () => {
        await act(async () => {
            root.render(<PhongTro />);
        });

        const ward = container.querySelector('[name="ward"]');
        act(() => {
            Simulate.change(ward, {
                target: {
                    name: 'ward',
                    value: 'Dịch Vọng',
                },
            });
        });

        const clearButton = [...container.querySelectorAll('button')]
            .find((button) => button.textContent.trim() === 'Xóa bộ lọc');
        await act(async () => {
            clearButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(ward.value).toBe('');
        expect(searchRentalProperties).toHaveBeenLastCalledWith({
            page: 0,
            size: 10,
        });
    });

    it('chuyển trang bằng cùng API tìm kiếm rental', async () => {
        searchRentalProperties.mockResolvedValue({
            content: [],
            totalElements: 13,
            totalPages: 3,
            number: 0,
        });

        await act(async () => {
            root.render(<PhongTro />);
        });

        const pageTwo = [...container.querySelectorAll('.rental-pagination button')]
            .find((button) => button.textContent.trim() === '2');
        await act(async () => {
            pageTwo.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(searchRentalProperties).toHaveBeenLastCalledWith({
            page: 1,
            size: 10,
        });
    });
});
