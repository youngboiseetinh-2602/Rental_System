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

export async function getConversationPage(cursor = null, size = 20) {
    const query = new URLSearchParams({ size: String(size) });
    if (cursor) query.set('cursor', cursor);
    const response = await apiFetch(`/api/conversations?${query}`);
    if (response.status === 404) {
        return { content: [], nextCursor: null, hasNext: false };
    }

    const body = await readResponse(response, 'Không thể tải danh sách trò chuyện.');
    return {
        content: Array.isArray(body?.content) ? body.content : [],
        nextCursor: body?.nextCursor || null,
        hasNext: Boolean(body?.hasNext),
    };
}

export async function getMyConversations() {
    const page = await getConversationPage();
    return page.content;
}

export async function createConversation(otherUserId) {
    const response = await apiFetch(`/api/conversations/${otherUserId}`, {
        method: 'POST',
    });
    return readResponse(response, 'Không thể bắt đầu cuộc trò chuyện.');
}

export async function getConversationMessagePage(conversationId, beforeId = null) {
    const query = beforeId ? `?beforeId=${encodeURIComponent(beforeId)}` : '';
    const response = await apiFetch(`/api/conversations/${conversationId}${query}`);
    const body = await readResponse(
        response,
        'Không thể tải nội dung cuộc trò chuyện.',
    );
    return {
        content: Array.isArray(body?.content) ? body.content : [],
        hasNext: body?.hasNext !== undefined
            ? Boolean(body.hasNext)
            : body?.last === false,
    };
}

export async function getConversationMessages(conversationId) {
    const page = await getConversationMessagePage(conversationId);
    return page.content;
}

export async function markConversationAsRead(conversationId) {
    const response = await apiFetch(
        `/api/conversations/${conversationId}/read`,
        { method: 'PATCH' },
    );
    return readResponse(response, 'Không thể đánh dấu cuộc trò chuyện đã đọc.');
}

export async function blockConversation(conversationId) {
    const response = await apiFetch(`/api/conversations/${conversationId}/block`, {
        method: 'PATCH',
    });
    return readResponse(response, 'Không thể chặn cuộc trò chuyện.');
}

export async function unblockConversation(conversationId) {
    const response = await apiFetch(`/api/conversations/${conversationId}/unblock`, {
        method: 'PATCH',
    });
    return readResponse(response, 'Không thể bỏ chặn cuộc trò chuyện.');
}

import { getStompClient } from './socketClient';

export async function sendConversationMessageViaSocket(
    conversationId,
    content
) {
    const client = await getStompClient();

    client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
            conversationId,
            content
        })
    });
}

export async function editConversationMessage(messageId, content) {
    const response = await apiFetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    return readResponse(response, 'Không thể chỉnh sửa tin nhắn.');
}

export async function deleteConversationMessage(messageId) {
    const response = await apiFetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
    });
    return readResponse(response, 'Không thể xóa tin nhắn.');
}
