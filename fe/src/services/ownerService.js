import { apiFetch } from './apiClient';

async function readJson(response, fallback) {
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || fallback);
    }
    return response.json();
}

export async function getOwnerProperties() {
    return readJson(
        await apiFetch('/api/owners/me/rental-properties'),
        'Không thể tải danh sách phòng trọ.',
    );
}

export async function getOwnerRentalRequests() {
    return readJson(
        await apiFetch('/api/owners/me/rental-requests'),
        'Không thể tải yêu cầu thuê trọ.',
    );
}

export async function deleteOwnerProperty(propertyId) {
    const response = await apiFetch(`/api/rental-properties/${propertyId}`, {
        method: 'DELETE',
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || 'Không thể xóa nhà trọ.');
    }
    return text;
}

export async function createOwnerProperty(payload) {
    const response = await apiFetch('/api/owners/me/rental-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const text = await response.text();
    if (!response.ok) {
        let message = text;
        try {
            const body = text ? JSON.parse(text) : null;
            message = body?.message || Object.values(body || {}).join('. ');
        } catch (error) {
            // Backend may return a plain-text business error.
        }
        throw new Error(message || 'Không thể tạo nhà trọ.');
    }
    return text;
}

export async function uploadPropertyImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiFetch('/api/system/property-image', {
        method: 'POST',
        body: formData,
    });
    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : null;
    } catch (error) {
        body = null;
    }
    if (!response.ok) {
        throw new Error(body?.message || text || 'Không thể tải ảnh nhà trọ.');
    }
    if (!body?.url) {
        throw new Error('Dịch vụ tải ảnh không trả về đường dẫn hợp lệ.');
    }
    return body.url;
}

export async function getOwnerPropertyDetail(propertyId) {
    const response = await apiFetch(`/api/rental-properties/${propertyId}`);
    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : null;
    } catch (error) {
        body = null;
    }
    if (!response.ok) {
        throw new Error(body?.message || text || 'Không thể tải chi tiết nhà trọ.');
    }
    return body;
}

export async function processOwnerRentalRequest(contractId, status, rejectionReason = '') {
    const query = new URLSearchParams({ status });
    if (status === 'CANCELLED') {
        query.set('rejectionReason', rejectionReason);
    }
    const response = await apiFetch(`/api/rental-requests/${contractId}?${query}`, {
        method: 'PATCH',
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || 'Không thể xử lý yêu cầu thuê trọ.');
    }
    return text;
}
