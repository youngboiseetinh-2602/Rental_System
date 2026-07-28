import { API_BASE_URL } from '../constants/config';
import { apiFetch } from './apiClient';

const RENTAL_FILTER_KEYS = [
    'rentalType',
    'description',
    'city',
    'ward',
    'street',
    'minPrice',
    'maxPrice',
];

export function normalizeRentalSearchParams(params = {}) {
    return RENTAL_FILTER_KEYS.reduce((searchParams, key) => {
        const value = params[key];
        if (value === null || value === undefined) {
            return searchParams;
        }

        const normalizedValue = typeof value === 'string'
            ? value.trim()
            : value;
        if (normalizedValue === '') {
            return searchParams;
        }

        searchParams[key] = normalizedValue;
        return searchParams;
    }, {});
}

export function mapRentalProperty(rental = {}) {
    const address = rental.detailedAddress
        || [
            rental.houseNumber,
            rental.street,
            rental.ward,
            rental.city,
        ].filter(Boolean).join(', ');

    return {
        id: rental.id,
        title: rental.name || 'Nhà trọ',
        description: rental.description || '',
        location: address || 'Chưa cập nhật địa chỉ',
        ownerName: rental.ownerName || '',
        ownerPhoneNumber: rental.ownerPhoneNumber || '',
        badges: rental.rentalTypeName ? [rental.rentalTypeName] : [],
    };
}

function emptyPage() {
    return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
    };
}

export async function searchRentalProperties(params = {}) {
    const normalizedParams = normalizeRentalSearchParams(params);
    const query = new URLSearchParams(normalizedParams).toString();
    const requestUrl = `${API_BASE_URL}/rental-properties${query ? `?${query}` : ''}`;
    const response = await fetch(requestUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 404) {
        return emptyPage();
    }

    if (!response.ok) {
        const text = await response.text();
        const requestError = new Error(
            text || response.statusText || 'Lỗi khi tìm phòng trọ',
        );
        requestError.status = response.status;
        throw requestError;
    }

    return response.json();
}

export async function getRentalPropertyDetail(rentalPropertyId) {
    const response = await fetch(`${API_BASE_URL}/rental-properties/${rentalPropertyId}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
    });
    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : null;
    } catch (error) {
        body = null;
    }
    if (!response.ok) {
        throw new Error(body?.message || text || 'Không thể tải chi tiết phòng trọ.');
    }
    return body;
}

export async function createRentalRequest(payload) {
    const response = await apiFetch('/api/users/me/rental-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const text = await response.text();
    let body = text;
    try {
        body = text ? JSON.parse(text) : null;
    } catch (error) {
        // This endpoint currently returns a plain-text success message.
    }
    if (!response.ok) {
        const message = body && typeof body === 'object'
            ? body.message || Object.values(body).join('. ')
            : body;
        throw new Error(message || 'Không thể gửi yêu cầu thuê trọ.');
    }
    return typeof body === 'string' ? body : 'Gửi yêu cầu thuê trọ thành công.';
}

export async function getMyRentalRequests() {
    const response = await apiFetch('/api/users/me/rental-requests');
    if (response.status === 404) return [];
    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || 'Không thể tải danh sách yêu cầu thuê trọ.');
    }
    return text ? JSON.parse(text) : [];
}

export async function cancelMyRentalRequest(contractId) {
    const response = await apiFetch(`/api/users/me/rental-requests/${contractId}`, {
        method: 'DELETE',
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || 'Không thể hủy yêu cầu thuê trọ.');
    }
    return text;
}
