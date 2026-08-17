import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import ChatRealtimeContext from './ChatRealtimeContext';
import useAuth from '../hooks/useAuth';
import {
    getMyConversations,
    markConversationAsRead,
} from '../services/conversationService';
import {
    disconnectStompClient,
    subscribeStomp,
    subscribeStompConnections,
} from '../services/socketClient';

const CHAT_MESSAGES_DESTINATION = '/user/queue/chat-messages';
const MAX_SEEN_MESSAGE_IDS = 1000;

function idKey(value) {
    return value === null || value === undefined ? null : String(value);
}

function totalUnread(unreadByConversation) {
    return Array.from(unreadByConversation.values()).reduce(
        (total, unread) => total + Math.max(0, Number(unread) || 0),
        0,
    );
}

export function ChatRealtimeProvider({ children }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const listenersRef = useRef(new Set());
    const reconnectListenersRef = useRef(new Set());
    const hasConnectedRef = useRef(false);
    const activeConversationIdRef = useRef(null);
    const unreadByConversationRef = useRef(new Map());
    const unreadVersionRef = useRef(0);
    const unreadVersionsByConversationRef = useRef(new Map());
    const seenMessageIdsRef = useRef(new Set());
    const seenMessageIdQueueRef = useRef([]);
    const userKey = idKey(user?.id || user?.userId || user?.sub);

    const replaceUnreadCounts = useCallback((nextCounts) => {
        unreadByConversationRef.current = nextCounts;
        setUnreadCount(totalUnread(nextCounts));
    }, []);

    const setConversationUnread = useCallback((conversationId, count) => {
        const key = idKey(conversationId);
        if (!key) return;

        const nextCounts = new Map(unreadByConversationRef.current);
        nextCounts.set(key, Math.max(0, Number(count) || 0));
        unreadVersionRef.current += 1;
        unreadVersionsByConversationRef.current.set(
            key,
            unreadVersionRef.current,
        );
        replaceUnreadCounts(nextCounts);
        return unreadVersionRef.current;
    }, [replaceUnreadCounts]);

    const requestMarkAsRead = useCallback((conversationId) => {
        const key = idKey(conversationId);
        if (!key) return Promise.resolve();

        const previousUnread = unreadByConversationRef.current.get(key) || 0;
        const optimisticVersion = setConversationUnread(key, 0);
        return markConversationAsRead(conversationId).catch((error) => {
            console.error('Không thể đánh dấu cuộc trò chuyện đã đọc:', error);
            if (
                unreadVersionsByConversationRef.current.get(key)
                === optimisticVersion
            ) {
                setConversationUnread(key, previousUnread);
            }
        });
    }, [setConversationUnread]);

    const setActiveConversationId = useCallback((conversationId) => {
        const key = idKey(conversationId);
        activeConversationIdRef.current = key;
        if (key) {
            requestMarkAsRead(conversationId);
        }
    }, [requestMarkAsRead]);

    const subscribeToChatEvents = useCallback((listener) => {
        listenersRef.current.add(listener);
        return () => listenersRef.current.delete(listener);
    }, []);

    const subscribeToChatReconnects = useCallback((listener) => {
        reconnectListenersRef.current.add(listener);
        if (hasConnectedRef.current) {
            Promise.resolve().then(() => {
                if (reconnectListenersRef.current.has(listener)) {
                    listener();
                }
            });
        }
        return () => reconnectListenersRef.current.delete(listener);
    }, []);

    useEffect(() => {
        if (!userKey) {
            activeConversationIdRef.current = null;
            hasConnectedRef.current = false;
            unreadByConversationRef.current = new Map();
            unreadVersionRef.current = 0;
            unreadVersionsByConversationRef.current = new Map();
            seenMessageIdsRef.current = new Set();
            seenMessageIdQueueRef.current = [];
            setUnreadCount(0);
            disconnectStompClient().catch(() => {});
            return undefined;
        }

        let active = true;
        activeConversationIdRef.current = null;
        hasConnectedRef.current = false;
        unreadByConversationRef.current = new Map();
        unreadVersionRef.current = 0;
        unreadVersionsByConversationRef.current = new Map();
        seenMessageIdsRef.current = new Set();
        seenMessageIdQueueRef.current = [];
        setUnreadCount(0);
        let latestUnreadRequest = 0;

        const loadUnreadCounts = () => {
            const requestId = latestUnreadRequest + 1;
            latestUnreadRequest = requestId;
            const requestVersion = unreadVersionRef.current;
            return getMyConversations()
                .then((conversations) => {
                    if (!active || requestId !== latestUnreadRequest) return;

                    const fetchedCounts = new Map(conversations.map((conversation) => [
                        idKey(conversation.id),
                        Math.max(0, Number(conversation.unreadCount) || 0),
                    ]));
                    unreadVersionsByConversationRef.current.forEach(
                        (version, conversationId) => {
                            if (
                                version > requestVersion
                                && unreadByConversationRef.current.has(conversationId)
                            ) {
                                fetchedCounts.set(
                                    conversationId,
                                    unreadByConversationRef.current.get(conversationId),
                                );
                            }
                        },
                    );
                    if (activeConversationIdRef.current) {
                        fetchedCounts.set(activeConversationIdRef.current, 0);
                    }
                    replaceUnreadCounts(fetchedCounts);
                })
                .catch(() => {
                    // The Chats page reports detailed API errors when it is opened.
                });
        };

        const unsubscribeConnection = subscribeStompConnections(() => {
            hasConnectedRef.current = true;
            loadUnreadCounts();
            if (activeConversationIdRef.current) {
                requestMarkAsRead(activeConversationIdRef.current);
            }
            reconnectListenersRef.current.forEach((listener) => {
                listener();
            });
        });

        const unsubscribe = subscribeStomp(CHAT_MESSAGES_DESTINATION, (frame) => {
            if (!active) return;

            let event;
            try {
                event = JSON.parse(frame.body);
            } catch (error) {
                console.error('Sự kiện chat realtime không hợp lệ:', error);
                return;
            }

            const { conversation, message } = event || {};
            if (!conversation?.id || !message?.id) return;

            const messageKey = idKey(message.id);
            if (seenMessageIdsRef.current.has(messageKey)) return;
            seenMessageIdsRef.current.add(messageKey);
            seenMessageIdQueueRef.current.push(messageKey);
            if (seenMessageIdQueueRef.current.length > MAX_SEEN_MESSAGE_IDS) {
                const oldestKey = seenMessageIdQueueRef.current.shift();
                seenMessageIdsRef.current.delete(oldestKey);
            }

            const conversationKey = idKey(conversation.id);
            const isActive = conversationKey === activeConversationIdRef.current;
            const normalizedEvent = {
                conversation: {
                    ...conversation,
                    unreadCount: isActive
                        ? 0
                        : Number(conversation.unreadCount || 0),
                },
                message,
            };

            setConversationUnread(
                conversation.id,
                normalizedEvent.conversation.unreadCount,
            );
            if (isActive) {
                requestMarkAsRead(conversation.id);
            }

            listenersRef.current.forEach((listener) => {
                try {
                    listener(normalizedEvent);
                } catch (error) {
                    console.error('Không thể cập nhật giao diện chat:', error);
                }
            });
        });

        loadUnreadCounts();

        return () => {
            active = false;
            unsubscribe();
            unsubscribeConnection();
            disconnectStompClient().catch(() => {});
        };
    }, [
        replaceUnreadCounts,
        requestMarkAsRead,
        setConversationUnread,
        userKey,
    ]);

    const contextValue = useMemo(() => ({
        unreadCount,
        requestMarkAsRead,
        setActiveConversationId,
        subscribeToChatEvents,
        subscribeToChatReconnects,
    }), [
        requestMarkAsRead,
        setActiveConversationId,
        subscribeToChatEvents,
        subscribeToChatReconnects,
        unreadCount,
    ]);

    return (
        <ChatRealtimeContext.Provider value={contextValue}>
            {children}
        </ChatRealtimeContext.Provider>
    );
}
