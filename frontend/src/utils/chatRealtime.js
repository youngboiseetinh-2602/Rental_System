function sameId(left, right) {
    return left !== null
        && left !== undefined
        && right !== null
        && right !== undefined
        && String(left) === String(right);
}

export function unreadTotalFromConversations(conversations) {
    return conversations.reduce(
        (total, conversation) => (
            total + Math.max(0, Number(conversation?.unreadCount) || 0)
        ),
        0,
    );
}

export function upsertConversationSummary(
    conversations,
    incomingConversation,
    adminId = null,
    activeConversationId = null,
) {
    if (!incomingConversation?.id) return conversations;

    const existing = conversations.find((conversation) => (
        sameId(conversation.id, incomingConversation.id)
    ));
    const updated = {
        ...existing,
        ...incomingConversation,
        unreadCount: sameId(incomingConversation.id, activeConversationId)
            ? 0
            : Number(incomingConversation.unreadCount || 0),
    };
    const withoutUpdated = conversations.filter((conversation) => (
        !sameId(conversation.id, incomingConversation.id)
    ));
    const next = [updated, ...withoutUpdated];

    if (!adminId) return next;

    return next.sort((left, right) => {
        const leftIsAdmin = sameId(left.otherUserId, adminId);
        const rightIsAdmin = sameId(right.otherUserId, adminId);
        return Number(rightIsAdmin) - Number(leftIsAdmin);
    });
}

export function mergeConversationLists(
    fetchedConversations,
    liveConversations,
    adminId = null,
) {
    return [...liveConversations].reverse().reduce(
        (result, conversation) => upsertConversationSummary(
            result,
            conversation,
            adminId,
        ),
        [...fetchedConversations],
    );
}

export function mergeMessages(...messageLists) {
    const messagesById = new Map();

    messageLists.flat().forEach((message, index) => {
        const key = message?.id === null || message?.id === undefined
            ? `missing-id-${index}`
            : String(message.id);
        messagesById.set(key, message);
    });

    return Array.from(messagesById.values()).sort((left, right) => {
        const leftTime = new Date(left?.sentAt).getTime();
        const rightTime = new Date(right?.sentAt).getTime();
        if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
            if (leftTime !== rightTime) return leftTime - rightTime;
        }

        const leftId = Number(left?.id);
        const rightId = Number(right?.id);
        return Number.isFinite(leftId) && Number.isFinite(rightId)
            ? leftId - rightId
            : 0;
    });
}
