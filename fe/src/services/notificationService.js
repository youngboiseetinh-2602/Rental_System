import { apiFetch } from './apiClient';

async function responseMessage(response, fallback) {
    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || fallback);
    }
    return text;
}

export async function getMyNotifications() {
    const response = await apiFetch('/api/users/me/notifications');
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Không thể tải danh sách thông báo.');
    }
    return response.json();
}

export async function markNotificationAsRead(notificationId) {
    return responseMessage(
        await apiFetch(`/api/users/me/notifications/${notificationId}`, {
            method: 'PATCH',
        }),
        'Không thể đánh dấu thông báo là đã đọc.',
    );
}
