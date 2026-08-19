vi.mock('./apiClient', () => ({
    apiFetch: jest.fn(),
}));

import { apiFetch } from './apiClient';
import {
    blockConversation,
    getConversationMessagePage,
    unblockConversation,
} from './conversationService';

function jsonResponse(body) {
    return {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    };
}

describe('conversationService message cursor', () => {
    beforeEach(() => jest.clearAllMocks());

    it('tải trang tin nhắn đầu tiên không có beforeId', async () => {
        apiFetch.mockResolvedValue(jsonResponse({
            content: [{ id: 30 }],
            last: false,
        }));

        await expect(getConversationMessagePage(7)).resolves.toEqual({
            content: [{ id: 30 }],
            hasNext: true,
        });
        expect(apiFetch).toHaveBeenCalledWith('/api/conversations/7');
    });

    it('truyền id tin nhắn cũ nhất làm cursor cho trang tiếp theo', async () => {
        apiFetch.mockResolvedValue(jsonResponse({ content: [], hasNext: false }));

        await getConversationMessagePage(7, 30);

        expect(apiFetch).toHaveBeenCalledWith('/api/conversations/7?beforeId=30');
    });

    it('gọi đúng hai endpoint chặn và bỏ chặn', async () => {
        apiFetch.mockResolvedValue(jsonResponse('Thành công'));

        await blockConversation(7);
        await unblockConversation(7);

        expect(apiFetch).toHaveBeenNthCalledWith(
            1,
            '/api/conversations/7/block',
            { method: 'PATCH' },
        );
        expect(apiFetch).toHaveBeenNthCalledWith(
            2,
            '/api/conversations/7/unblock',
            { method: 'PATCH' },
        );
    });
});
