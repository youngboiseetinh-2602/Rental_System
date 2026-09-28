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
        getRevenueHistory.mockResolvedValue([]);
        global.IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.useRealTimers();
    });
    const click = async (label) => act(async () => {
        [...container.querySelectorAll('button')].find(button => button.textContent === label).click();
    });

    it('automatically shows saved current-month statistics in Vietnam time without initializing', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-09-30T18:00:00Z'));
        getRevenueHistory.mockResolvedValue([
            { year: 2026, month: 9, revenue: 2000000, profit: 1900000 },
            { year: 2026, month: 10, revenue: 5000000, profit: 4750000 },
        ]);
        await act(async () => root.render(<RevenueOverview />));
        expect(getRevenueHistory).toHaveBeenCalledWith(false);
        expect(getCurrentRevenue).not.toHaveBeenCalled();
        expect(container.textContent).toContain('Tháng 10/2026');
        expect(container.textContent).toContain('4.750.000');
        expect(container.querySelector('table')).toBeNull();
    });

    it('does not display an older month or initialize a missing current month', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-15T00:00:00Z'));
        getRevenueHistory.mockResolvedValue([{ year: 2026, month: 9, revenue: 5000000, profit: 4750000 }]);
        await act(async () => root.render(<RevenueOverview />));
        expect(container.textContent).toContain('Chưa có thống kê tháng hiện tại');
        expect(container.textContent).not.toContain('4.750.000');
        expect(getCurrentRevenue).not.toHaveBeenCalled();
    });

    it('allows manual statistics after saved statistics fail to load', async () => {
        getRevenueHistory.mockRejectedValue(new Error('Lỗi tải thống kê đã lưu'));
        getCurrentRevenue.mockResolvedValue({ year: 2026, month: 10, revenue: 0, profit: 0 });
        await act(async () => root.render(<RevenueOverview />));
        expect(container.querySelector('[role="alert"]').textContent).toContain('Lỗi tải');
        await click('Thống kê');
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.textContent).toContain('Tháng 10/2026');
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
