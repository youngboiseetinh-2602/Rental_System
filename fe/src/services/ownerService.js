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

export async function getOwnerContracts() {
    return readJson(
        await apiFetch('/api/owners/me/contracts'),
        'Không thể tải danh sách hợp đồng thuê.',
    );
}

export async function sendOwnerNotification(payload) {
    const response = await apiFetch('/api/owners/me/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : null;
    } catch (error) {
        body = null;
    }
    if (!response.ok) {
        throw new Error(body?.message || text || 'Không thể gửi thông báo.');
    }
    return body;
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

export async function updateOwnerProperty(propertyId, payload) {
    const response = await apiFetch(`/api/rental-properties/${propertyId}`, {
        method: 'PUT',
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
            // Backend có thể trả về thông báo nghiệp vụ dạng văn bản.
        }
        throw new Error(message || 'Không thể cập nhật nhà trọ.');
    }
    return text;
}

async function mutateRoomConfiguration(path, method, payload, fallback) {
    const response = await apiFetch(path, {
        method,
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    if (!response.ok) {
        let message = text;
        try {
            const body = text ? JSON.parse(text) : null;
            message = body?.message || Object.values(body || {}).join('. ');
        } catch (error) {
            // Backend có thể trả về thông báo nghiệp vụ dạng văn bản.
        }
        throw new Error(message || fallback);
    }
    return text;
}

export const addOwnerRoomType = (propertyId, payload) =>
    mutateRoomConfiguration(
        `/api/rental-properties/${propertyId}/room-types`,
        'POST', payload, 'Không thể thêm loại phòng.',
    );

export const updateOwnerRoomType = (roomTypeId, payload) =>
    mutateRoomConfiguration(
        `/api/room-types/${roomTypeId}`,
        'PUT', payload, 'Không thể cập nhật loại phòng.',
    );

export const deleteOwnerRoomType = (roomTypeId) =>
    mutateRoomConfiguration(
        `/api/room-types/${roomTypeId}`,
        'DELETE', null, 'Không thể xóa loại phòng.',
    );

export const addOwnerFacilities = (roomTypeId, payload) =>
    mutateRoomConfiguration(
        `/api/room-types/${roomTypeId}/facilities`,
        'POST', payload, 'Không thể thêm tiện nghi.',
    );

export const updateOwnerFacility = (facilityId, payload) =>
    mutateRoomConfiguration(
        `/api/facilities/${facilityId}`,
        'PUT', payload, 'Không thể cập nhật tiện nghi.',
    );

export const deleteOwnerFacility = (facilityId) =>
    mutateRoomConfiguration(
        `/api/facilities/${facilityId}`,
        'DELETE', null, 'Không thể xóa tiện nghi.',
    );

export const addOwnerRooms = (roomTypeId, payload) =>
    mutateRoomConfiguration(
        `/api/room-types/${roomTypeId}/rooms`,
        'POST', payload, 'Không thể thêm phòng.',
    );

export const deleteOwnerRoom = (roomId) =>
    mutateRoomConfiguration(
        `/api/rooms/${roomId}`,
        'DELETE', null, 'Không thể xóa phòng.',
    );

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

export async function getOwnerPropertyTenants(propertyId) {
    return readJson(
        await apiFetch(`/api/rental-properties/${propertyId}/tenants`),
        'Không thể tải danh sách người thuê.',
    );
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
