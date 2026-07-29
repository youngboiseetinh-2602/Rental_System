import { apiFetch } from './apiClient';

async function readResponse(response, fallback) {
    const text = await response.text();
    let body = text;
    try { body = text ? JSON.parse(text) : null; } catch (error) { /* plain text */ }
    if (!response.ok) {
        const message = body && typeof body === 'object'
            ? body.message || Object.values(body).join('. ') : body;
        throw new Error(message || fallback);
    }
    return body;
}

export async function getAdminUsers(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) query.set(key, value);
    });
    const response = await apiFetch(`/api/admin/users?${query}`);
    if (response.status === 404) return { content: [], totalElements: 0, totalPages: 0, number: 0 };
    return readResponse(response, 'Không thể tải danh sách tài khoản.');
}

export async function updateAdminUserStatus(id, status) {
    const response = await apiFetch(`/api/admin/users/${id}/status?status=${status}`, { method: 'PATCH' });
    return readResponse(response, 'Không thể cập nhật trạng thái.');
}

export async function getRentalTypes() {
    const response = await apiFetch('/api/admin/rental-types');
    if (response.status === 404) return [];
    return readResponse(response, 'Không thể tải loại hình cho thuê.');
}

export async function createRentalType(payload) {
    const response = await apiFetch('/api/admin/rental-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return readResponse(response, 'Không thể thêm loại hình cho thuê.');
}

export async function updateRentalType(id, payload) {
    const response = await apiFetch(`/api/admin/rental-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return readResponse(response, 'Không thể cập nhật loại hình cho thuê.');
}

export async function deleteRentalType(id) {
    const response = await apiFetch(`/api/admin/rental-types/${id}`, {
        method: 'DELETE',
    });
    return readResponse(response, 'Không thể xóa loại hình cho thuê.');
}
