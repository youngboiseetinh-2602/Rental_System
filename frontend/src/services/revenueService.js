// /new/ - File moi cho thong ke doanh thu.
import { apiFetch } from './apiClient';

async function readRevenue(path) {
    const response = await apiFetch(path);
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    if (!response.ok) throw new Error(body?.message || text || 'Không thể tải doanh thu.');
    return body;
}

const basePath = (admin) => admin ? '/api/admin/revenue' : '/api/owners/me/revenue';
export const getCurrentRevenue = (admin = false) => readRevenue(`${basePath(admin)}/current`);
export const getRevenueHistory = (admin = false) => readRevenue(`${basePath(admin)}/history`);
export const getOwnersMissingRevenue = () => readRevenue('/api/admin/revenue/missing-owners');

export async function remindOwnerRevenue(ownerId) {
    const response = await apiFetch(`/api/admin/notifications/${ownerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: 'Nhắc thống kê doanh thu tháng hiện tại',
            content: 'Vui lòng mở trang tổng quan và bấm Thống kê để cập nhật doanh thu tháng hiện tại.',
        }),
    });
    if (!response.ok) throw new Error('Không thể gửi thông báo nhắc thống kê.');
}
