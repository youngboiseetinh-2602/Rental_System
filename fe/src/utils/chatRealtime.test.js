import {
    mergeConversationLists,
    mergeMessages,
    unreadTotalFromConversations,
    upsertConversationSummary,
} from './chatRealtime';

describe('chat realtime helpers', () => {
    test('upserts and moves a changed conversation to the front', () => {
        const current = [
            { id: 1, latestMessage: 'old one', unreadCount: 0 },
            { id: 2, latestMessage: 'old two', unreadCount: 0 },
        ];

        expect(upsertConversationSummary(current, {
            id: 2,
            latestMessage: 'new two',
            unreadCount: 1,
        })).toEqual([
            { id: 2, latestMessage: 'new two', unreadCount: 1 },
            { id: 1, latestMessage: 'old one', unreadCount: 0 },
        ]);
    });

    test('keeps the active conversation read', () => {
        const result = upsertConversationSummary(
            [],
            { id: 7, unreadCount: 3 },
            null,
            '7',
        );

        expect(result[0].unreadCount).toBe(0);
    });

    test('merges a socket update over a REST conversation list', () => {
        const result = mergeConversationLists(
            [{ id: 1, latestMessage: 'REST', unreadCount: 0 }],
            [{ id: 1, latestMessage: 'socket', unreadCount: 1 }],
        );

        expect(result).toEqual([
            { id: 1, latestMessage: 'socket', unreadCount: 1 },
        ]);
    });

    test('preserves newest-first ordering for several live summaries', () => {
        const result = mergeConversationLists(
            [{ id: 1 }, { id: 2 }, { id: 3 }],
            [
                { id: 3, latestMessage: 'newest' },
                { id: 2, latestMessage: 'older' },
            ],
        );

        expect(result.map((conversation) => conversation.id)).toEqual([3, 2, 1]);
    });

    test('deduplicates and chronologically merges REST and socket messages', () => {
        const result = mergeMessages(
            [
                { id: 1, content: 'first', sentAt: '2026-08-15T10:00:00' },
                { id: 2, content: 'REST copy', sentAt: '2026-08-15T10:01:00' },
            ],
            [
                { id: 2, content: 'socket copy', sentAt: '2026-08-15T10:01:00' },
                { id: 3, content: 'third', sentAt: '2026-08-15T10:02:00' },
            ],
        );

        expect(result.map((message) => message.id)).toEqual([1, 2, 3]);
        expect(result[1].content).toBe('socket copy');
    });

    test('totals normalized unread counts', () => {
        expect(unreadTotalFromConversations([
            { unreadCount: 2 },
            { unreadCount: '3' },
            { unreadCount: -1 },
        ])).toBe(5);
    });
});
