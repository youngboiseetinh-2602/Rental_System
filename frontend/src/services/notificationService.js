import { apiFetch } from './apiClient';

export async function getSentNotifications() {
    const response = await apiFetch('/api/admin/notifications/sent');
    if (!response.ok) {
        const messages = {
            401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            403: 'Tài khoản không có quyền xem lịch sử thông báo admin.',
            404: 'API lịch sử thông báo chưa khả dụng. Vui lòng kiểm tra bản deploy backend.',
        };
        throw new Error(messages[response.status]
            || `Không thể tải lịch sử thông báo đã gửi (HTTP ${response.status}).`);
    }
    return response.json();
}

export async function broadcastNotification({ title, content }) {
    return responseMessage(await apiFetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
    }), 'Không thể gửi thông báo toàn cục.');
}

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
