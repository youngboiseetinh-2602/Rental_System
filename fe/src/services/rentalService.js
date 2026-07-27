import { API_BASE_URL } from '../constants/config';

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
