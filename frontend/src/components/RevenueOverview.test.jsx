// /new/ - File moi cho thong ke doanh thu.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import RevenueOverview from './RevenueOverview';
import { getCurrentRevenue, getRevenueHistory, getOwnersMissingRevenue, remindOwnerRevenue } from '../services/revenueService';

vi.mock('../services/revenueService', () => ({
    getCurrentRevenue: vi.fn(), getRevenueHistory: vi.fn(),
    getOwnersMissingRevenue: vi.fn(), remindOwnerRevenue: vi.fn(),
}));

describe('revenue overview', () => {
    let root;
    let container;
    beforeEach(() => {
        vi.resetAllMocks();
        global.IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });
    const click = async (label) => act(async () => {
        [...container.querySelectorAll('button')].find(button => button.textContent === label).click();
    });

    it('loads owner statistics on click and refreshes displayed history after initialization', async () => {
        getCurrentRevenue.mockResolvedValue({ year: 2026, month: 10, revenue: 1000000, profit: 950000 });
        getRevenueHistory.mockResolvedValue([]);
        await act(async () => root.render(<RevenueOverview />));
        expect(getCurrentRevenue).not.toHaveBeenCalled();
        await click('Lịch sử doanh thu');
        expect(container.textContent).toContain('Chưa có thống kê được lưu.');
        getRevenueHistory.mockResolvedValue([{ year: 2026, month: 10, revenue: 1000000, profit: 950000 }]);
        await click('Thống kê');
        expect(getCurrentRevenue).toHaveBeenCalledWith(false);
        expect(container.textContent).toContain('950.000');
        expect(container.textContent).not.toContain('Chưa có thống kê được lưu.');
        expect(getOwnersMissingRevenue).not.toHaveBeenCalled();
    });

    it('shows missing owners and sends a reminder only when clicked', async () => {
        getOwnersMissingRevenue.mockResolvedValue([{ id: 7, fullName: 'Chủ trọ A', username: 'owner_a' }]);
        remindOwnerRevenue.mockResolvedValue(undefined);
        await act(async () => root.render(<RevenueOverview admin />));
        await click('Chủ trọ chưa thống kê');
        expect(container.textContent).toContain('Chủ trọ A');
        expect(remindOwnerRevenue).not.toHaveBeenCalled();
        await click('Gửi nhắc thống kê');
        expect(remindOwnerRevenue).toHaveBeenCalledWith(7);
        expect(container.textContent).toContain('Đã gửi nhắc thống kê');
    });

    it('shows errors and permits retry', async () => {
        getCurrentRevenue.mockRejectedValue(new Error('Không thể tải doanh thu.'));
        await act(async () => root.render(<RevenueOverview admin />));
        await click('Thống kê');
        expect(container.querySelector('[role="alert"]').textContent).toContain('Không thể tải');
        expect(container.querySelector('button').disabled).toBe(false);
    });
});
