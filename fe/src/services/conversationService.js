import { apiFetch } from './apiClient';

async function readResponse(response, fallbackMessage) {
    const text = await response.text();
    let body = null;

    try {
        body = text ? JSON.parse(text) : null;
    } catch (error) {
        body = text;
    }

    if (!response.ok) {
        const requestError = new Error(
            body?.message || (typeof body === 'string' ? body : '') || fallbackMessage,
        );
        requestError.status = response.status;
        throw requestError;
    }

    return body;
}

export async function getMyConversations(page = 0) {
    const response = await apiFetch(`/api/conversations?page=${page}`);
    if (response.status === 404) {
        return [];
    }

    const body = await readResponse(response, 'Không thể tải danh sách trò chuyện.');
    return Array.isArray(body?.content) ? body.content : [];
}

export async function createConversation(otherUserId) {
    const response = await apiFetch(`/api/conversations/${otherUserId}`, {
        method: 'POST',
    });
    return readResponse(response, 'Không thể bắt đầu cuộc trò chuyện.');
}
