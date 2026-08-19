import { API_BASE_URL } from '../constants/config';
import { apiFetch } from './apiClient';
import { uploadImageToImageKit } from './imageUploadService';

async function readApiResponse(response, fallbackMessage) {
    const text = await response.text();
    let body = text;
    try {
        body = text ? JSON.parse(text) : null;
    } catch (error) {
        // Some backend endpoints intentionally return plain text.
    }
    if (!response.ok) {
        const message = body && typeof body === 'object'
            ? body.message || Object.values(body).join('. ')
            : body;
        throw new Error(message || fallbackMessage);
    }
    return body;
}

export async function getMyProfile() {
    const response = await apiFetch('/api/users/me');
    return readApiResponse(response, 'Không thể tải thông tin cá nhân.');
}

export async function updateMyProfile(payload) {
    const response = await apiFetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return readApiResponse(response, 'Không thể cập nhật thông tin cá nhân.');
}

export async function changeMyPassword(payload) {
    const response = await apiFetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return readApiResponse(response, 'Không thể đổi mật khẩu.');
}

export async function uploadAvatarImage(file) {
    return uploadImageToImageKit(file, {
        folder: '/rental-room/avatars',
        prefix: 'avatar',
    });
}

export async function registerUser(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseBody = responseText;
    try {
        responseBody = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
        // The current backend returns plain text for success and business errors.
    }

    if (!response.ok) {
        let message;
        if (responseBody && typeof responseBody === 'object') {
            message = responseBody.message
                || Object.entries(responseBody)
                    .map(([field, detail]) => `${field}: ${detail}`)
                    .join('. ');
        } else {
            message = responseBody;
        }

        const registrationError = new Error(
            message || response.statusText || 'Đăng ký thất bại',
        );
        registrationError.status = response.status;
        registrationError.fieldErrors =
            responseBody && typeof responseBody === 'object'
                ? responseBody
                : null;
        throw registrationError;
    }

    if (responseBody && typeof responseBody === 'object') {
        return responseBody.message || 'Đăng ký thành công';
    }

    return responseBody || 'Đăng ký thành công';
}
