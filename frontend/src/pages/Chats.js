import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
    blockConversation,
    deleteConversationMessage,
    createConversation,
    editConversationMessage,
    getConversationPage,
    getConversationMessagePage,
    getConversationMessages,
    getMyConversations,
    sendConversationMessageViaSocket,
    unblockConversation,
} from '../services/conversationService';
import { getMyProfile } from '../services/userService';
import { getAdminContact } from '../services/contactService';
import { userHasRole } from '../utils/authRouting';
import {
    mergeConversationLists,
    mergeMessages,
    upsertConversationSummary,
} from '../utils/chatRealtime';
import useChatRealtime from '../hooks/useChatRealtime';
import AccountNavigation from '../components/AccountNavigation';

function initialsOf(name) {
    return String(name || '?')
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function relativeTime(value) {
    if (!value) return '';
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return '';

    const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ`;
    return `${Math.floor(minutes / 1440)} ngày`;
}

function pinAdminConversation(conversations, adminId) {
    if (!adminId || !Array.isArray(conversations)) return conversations;
    return [...conversations].sort((left, right) => {
        const leftIsAdmin = String(left.otherUserId) === String(adminId);
        const rightIsAdmin = String(right.otherUserId) === String(adminId);
        return Number(rightIsAdmin) - Number(leftIsAdmin);
    });
}

function Chats() {
    const { user } = useAuth();
    const {
        setActiveConversationId,
        subscribeToChatEvents,
        subscribeToChatReconnects,
    } = useChatRealtime();
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [conversationCursor, setConversationCursor] = useState(null);
    const [hasMoreConversations, setHasMoreConversations] = useState(false);
    const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [query, setQuery] = useState('');
    const [conversationFilter, setConversationFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [hasOlderMessages, setHasOlderMessages] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [messageActionId, setMessageActionId] = useState(null);
    const [conversationActionLoading, setConversationActionLoading] = useState(false);
    const [incomingMessageNotice, setIncomingMessageNotice] = useState(null);
    const messagesContainerRef = useRef(null);
    const previousMessageCountRef = useRef(0);
    const pendingInitialScrollRef = useRef(false);
    const preserveOlderScrollRef = useRef(null);
    const olderMessagesLoadingRef = useRef(false);
    const selectedIdRef = useRef(null);
    const adminIdRef = useRef(null);
    const liveConversationUpdatesRef = useRef(new Map());
    const realtimeVersionRef = useRef(0);
    const reconnectRequestRef = useRef(0);
    const isOwner = userHasRole(user, 'OWNER');
    const isAdmin = userHasRole(user, 'ADMIN');
    const currentUserId = profile?.id || user?.id || user?.userId || user?.sub;

    useLayoutEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    const liveConversationsAfter = useCallback((version) => (
        Array.from(liveConversationUpdatesRef.current.values())
            .filter((update) => update.version > version)
            .sort((left, right) => right.version - left.version)
            .map((update) => update.conversation)
    ), []);

    useEffect(() => subscribeToChatEvents(({ conversation, message }) => {
        const isSelected = String(conversation.id)
            === String(selectedIdRef.current);
        const isIncoming = String(message.senderId) !== String(currentUserId);
        const normalizedConversation = {
            ...conversation,
            unreadCount: isSelected
                ? 0
                : Number(conversation.unreadCount || 0),
        };

        realtimeVersionRef.current += 1;
        liveConversationUpdatesRef.current.set(String(conversation.id), {
            conversation: normalizedConversation,
            version: realtimeVersionRef.current,
        });
        setConversations((current) => upsertConversationSummary(
            current,
            normalizedConversation,
            adminIdRef.current,
            selectedIdRef.current,
        ));

        if (isSelected) {
            setMessages((current) => mergeMessages(current, [message]));
            if (isIncoming) {
                setIncomingMessageNotice({
                    id: message.id,
                    senderName: conversation.name || 'Người dùng',
                    content: message.content || 'Bạn có tin nhắn mới.',
                });
            }
        }
    }), [currentUserId, subscribeToChatEvents]);

    useEffect(() => {
        if (!incomingMessageNotice) return undefined;
        const timeoutId = window.setTimeout(
            () => setIncomingMessageNotice(null),
            4000,
        );
        return () => window.clearTimeout(timeoutId);
    }, [incomingMessageNotice]);

    useEffect(() => {
        let active = true;
        const requestVersion = realtimeVersionRef.current;
        setLoading(true);
        setError('');
        Promise.all([
            getMyProfile(),
            getConversationPage(),
            getAdminContact().catch(() => null),
        ])
            .then(async ([profileData, conversationPage, adminContact]) => {
                if (!active) return;
                setProfile(profileData);
                setConversationCursor(conversationPage.nextCursor);
                setHasMoreConversations(conversationPage.hasNext);
                adminIdRef.current = adminContact?.id || null;
                let currentConversations = mergeConversationLists(
                    pinAdminConversation(conversationPage.content, adminContact?.id),
                    liveConversationsAfter(requestVersion),
                    adminContact?.id,
                );
                setConversations(currentConversations);
                const requestedUserId = location.state?.otherUserId
                    || new URLSearchParams(location.search).get('contact');
                let requestedConversation = currentConversations.find(
                    (conversation) => String(conversation.otherUserId) === String(requestedUserId),
                );
                if (requestedUserId && !requestedConversation) {
                    await createConversation(requestedUserId);
                    const refreshVersion = realtimeVersionRef.current;
                    const refreshedPage = await getConversationPage();
                    currentConversations = mergeConversationLists(
                        pinAdminConversation(
                            refreshedPage.content,
                            adminContact?.id,
                        ),
                        liveConversationsAfter(refreshVersion),
                        adminContact?.id,
                    );
                    if (!active) return;
                    setConversationCursor(refreshedPage.nextCursor);
                    setHasMoreConversations(refreshedPage.hasNext);
                    setConversations(currentConversations);
                    requestedConversation = currentConversations.find(
                        (conversation) => String(conversation.otherUserId) === String(requestedUserId),
                    );
                }
                setSelectedId(requestedConversation?.id || null);
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [liveConversationsAfter, location.search, location.state]);

    const loadMoreConversations = async () => {
        if (!conversationCursor || loadingMoreConversations) return;
        setLoadingMoreConversations(true);
        try {
            const nextPage = await getConversationPage(conversationCursor);
            setConversations((current) => {
                const knownIds = new Set(current.map(({ id }) => String(id)));
                return [
                    ...current,
                    ...nextPage.content.filter(({ id }) => !knownIds.has(String(id))),
                ];
            });
            setConversationCursor(nextPage.nextCursor);
            setHasMoreConversations(nextPage.hasNext);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoadingMoreConversations(false);
        }
    };

    useEffect(() => {
        if (loading) return undefined;

        let mounted = true;

        const unsubscribe = subscribeToChatReconnects(() => {
            const requestId = reconnectRequestRef.current + 1;
            reconnectRequestRef.current = requestId;
            const requestVersion = realtimeVersionRef.current;
            const conversationId = selectedIdRef.current;

            Promise.all([
                getConversationPage(),
                conversationId
                    ? getConversationMessages(conversationId)
                    : Promise.resolve(null),
            ]).then(([conversationPage, messageData]) => {
                if (!mounted || requestId !== reconnectRequestRef.current) return;

                const refreshedConversations = mergeConversationLists(
                    pinAdminConversation(conversationPage.content, adminIdRef.current),
                    liveConversationsAfter(requestVersion),
                    adminIdRef.current,
                ).map((conversation) => (
                    String(conversation.id) === String(selectedIdRef.current)
                        ? { ...conversation, unreadCount: 0 }
                        : conversation
                ));
                setConversationCursor(conversationPage.nextCursor);
                setHasMoreConversations(conversationPage.hasNext);
                setConversations(refreshedConversations);

                if (
                    messageData
                    && String(conversationId) === String(selectedIdRef.current)
                ) {
                    setMessages((current) => mergeMessages(
                        [...messageData].reverse(),
                        current,
                    ));
                }
            }).catch(() => {
                // Existing UI state stays usable while the socket retries.
            });
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [liveConversationsAfter, loading, subscribeToChatReconnects]);

    const filteredConversations = useMemo(() => {
        const keyword = query.trim().toLocaleLowerCase('vi');
        return conversations.filter((conversation) => {
            const matchesFilter = conversationFilter === 'ALL'
                || Number(conversation.unreadCount || 0) > 0;
            const matchesQuery = !keyword
                || conversation.name?.toLocaleLowerCase('vi').includes(keyword)
                || conversation.latestMessage?.toLocaleLowerCase('vi').includes(keyword);
            return matchesFilter && matchesQuery;
        });
    }, [conversationFilter, conversations, query]);
    const selectedConversation = useMemo(
        () => conversations.find((conversation) => (
            String(conversation.id) === String(selectedId)
        )) || null,
        [conversations, selectedId],
    );

    useEffect(() => {
        setActiveConversationId(selectedId);
        if (selectedId) {
            const liveUpdate = liveConversationUpdatesRef.current.get(
                String(selectedId),
            );
            if (liveUpdate) {
                liveConversationUpdatesRef.current.set(String(selectedId), {
                    ...liveUpdate,
                    conversation: {
                        ...liveUpdate.conversation,
                        unreadCount: 0,
                    },
                });
            }
            setConversations((current) => current.map((conversation) => (
                String(conversation.id) === String(selectedId)
                    ? { ...conversation, unreadCount: 0 }
                    : conversation
            )));
        }

        return () => setActiveConversationId(null);
    }, [selectedId, setActiveConversationId]);

    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            setHasOlderMessages(false);
            olderMessagesLoadingRef.current = false;
            previousMessageCountRef.current = 0;
            return undefined;
        }

        let active = true;
        setMessages([]);
        setHasOlderMessages(false);
        setMessagesLoading(true);
        setMessageError('');

        getConversationMessagePage(selectedId)
            .then((page) => {
                if (!active) return;
                pendingInitialScrollRef.current = true;
                previousMessageCountRef.current = 0;
                setHasOlderMessages(page.hasNext);
                setMessages((current) => mergeMessages(
                    [...page.content].reverse(),
                    current,
                ));
                setConversations((current) => current.map((conversation) => (
                    String(conversation.id) === String(selectedId)
                        ? { ...conversation, unreadCount: 0 }
                        : conversation
                )));
            })
            .catch((requestError) => active && setMessageError(requestError.message))
            .finally(() => active && setMessagesLoading(false));
        return () => {
            active = false;
        };
    }, [selectedId]);

    const loadOlderMessages = async () => {
        const oldestMessageId = messages[0]?.id;
        if (
            !selectedId
            || !oldestMessageId
            || !hasOlderMessages
            || olderMessagesLoadingRef.current
        ) return;
        const conversationId = selectedId;
        preserveOlderScrollRef.current = messagesContainerRef.current?.scrollHeight ?? null;
        olderMessagesLoadingRef.current = true;
        setMessageError('');
        try {
            const page = await getConversationMessagePage(conversationId, oldestMessageId);
            if (String(conversationId) !== String(selectedIdRef.current)) return;
            setHasOlderMessages(page.hasNext);
            setMessages((current) => mergeMessages(
                [...page.content].reverse(),
                current,
            ));
        } catch (requestError) {
            preserveOlderScrollRef.current = null;
            setMessageError(requestError.message);
        } finally {
            olderMessagesLoadingRef.current = false;
        }
    };

    const handleMessagesScroll = (event) => {
        if (event.currentTarget.scrollTop <= 40) {
            loadOlderMessages();
        }
    };

    useLayoutEffect(() => {
        if (preserveOlderScrollRef.current === null || !messagesContainerRef.current) return;
        const container = messagesContainerRef.current;
        container.scrollTop += container.scrollHeight - preserveOlderScrollRef.current;
        preserveOlderScrollRef.current = null;
        previousMessageCountRef.current = messages.length;
    }, [messages.length]);

    useEffect(() => {
        if (messagesLoading || !messagesContainerRef.current) return;

        const isNewConversation = pendingInitialScrollRef.current;
        const hasNewMessage = messages.length > previousMessageCountRef.current;
        if (isNewConversation || hasNewMessage) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: isNewConversation ? 'auto' : 'smooth',
            });
        }
        pendingInitialScrollRef.current = false;
        previousMessageCountRef.current = messages.length;
    }, [messages.length, messagesLoading, selectedId]);

    const username = profile?.fullName || user?.name || user?.username || 'Người dùng';
    const conversationBlocked = selectedConversation?.status === 'BLOCKED';
    const toggleConversationBlock = async () => {
        if (!selectedConversation || conversationActionLoading) return;
        const shouldUnblock = conversationBlocked
            && selectedConversation.blockedByCurrentUser;
        if (conversationBlocked && !shouldUnblock) return;
        const actionLabel = shouldUnblock ? 'bỏ chặn' : 'chặn';
        if (!window.confirm(`Bạn có chắc muốn ${actionLabel} cuộc trò chuyện này?`)) return;

        setConversationActionLoading(true);
        setMessageError('');
        try {
            if (shouldUnblock) {
                await unblockConversation(selectedConversation.id);
            } else {
                await blockConversation(selectedConversation.id);
            }
            setConversations((current) => current.map((conversation) => (
                String(conversation.id) === String(selectedConversation.id)
                    ? {
                        ...conversation,
                        status: shouldUnblock ? 'ACTIVE' : 'BLOCKED',
                        blockedByCurrentUser: !shouldUnblock,
                    }
                    : conversation
            )));
        } catch (requestError) {
            setMessageError(requestError.message);
        } finally {
            setConversationActionLoading(false);
        }
    };

    const submitMessage = async (event) => {
        event.preventDefault();
        const content = draft.trim();
        if (!content || !selectedId || sending || conversationBlocked) return;

        setSending(true);
        setMessageError('');
        try {
            await sendConversationMessageViaSocket(selectedId, content);
            setDraft('');
        } catch (requestError) {
            setMessageError(requestError.message || 'Không thể gửi tin nhắn.');
        } finally {
            setSending(false);
        }
    };

    const startEditingMessage = (message) => {
        setEditingId(message.id);
        setEditingContent(message.content);
        setMessageError('');
    };

    const cancelEditingMessage = () => {
        setEditingId(null);
        setEditingContent('');
    };

    const submitEditedMessage = async (event, message) => {
        event.preventDefault();
        const content = editingContent.trim();
        if (!content || messageActionId) return;

        setMessageActionId(message.id);
        setMessageError('');
        try {
            await editConversationMessage(message.id, content);
            const isLatestMessage = messages.at(-1)?.id === message.id;
            setMessages((current) => current.map((item) => (
                item.id === message.id
                    ? { ...item, content, note: 'Đã chỉnh sửa' }
                    : item
            )));
            if (isLatestMessage) {
                setConversations((current) => current.map((conversation) => (
                    String(conversation.id) === String(selectedId)
                        ? { ...conversation, latestMessage: content }
                        : conversation
                )));
            }
            cancelEditingMessage();
        } catch (requestError) {
            setMessageError(requestError.message);
        } finally {
            setMessageActionId(null);
        }
    };

    const removeMessage = async (message) => {
        if (messageActionId
            || !window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;

        setMessageActionId(message.id);
        setMessageError('');
        try {
            await deleteConversationMessage(message.id);
            const recalledMessage = {
                ...message,
                hidden: true,
                note: 'Đã thu hồi',
            };
            setMessages((current) => current.map((item) => (
                item.id === message.id ? recalledMessage : item
            )));
            const isLatestMessage = messages.at(-1)?.id === message.id;
            setConversations((current) => current.map((conversation) => (
                String(conversation.id) === String(selectedId)
                    ? {
                        ...conversation,
                        latestMessage: isLatestMessage
                            ? 'Tin nhắn đã được thu hồi'
                            : conversation.latestMessage,
                    }
                    : conversation
            )));
            if (editingId === message.id) cancelEditingMessage();
        } catch (requestError) {
            setMessageError(requestError.message);
        } finally {
            setMessageActionId(null);
        }
    };

    return (
        <div className="profile-shell chats-shell overflow-hidden">
            {incomingMessageNotice && (
                <button
                    type="button"
                    className="conversation-incoming-notice"
                    onClick={() => setIncomingMessageNotice(null)}
                    aria-live="polite"
                >
                    <strong>Tin nhắn mới từ {incomingMessageNotice.senderName}</strong>
                    <span>{incomingMessageNotice.content}</span>
                </button>
            )}
            <aside className="profile-sidebar">
                <NavLink className="profile-sidebar-user" to="/profile">
                    <div className="profile-avatar">
                        {profile?.avatarUrl
                            ? <img src={profile.avatarUrl} alt={`Ảnh đại diện của ${username}`} />
                            : <span>{initialsOf(username)}</span>}
                    </div>
                    <div>
                        <strong>{username}</strong>
                        <span>{isAdmin ? 'Quản trị viên' : isOwner ? 'Chủ trọ' : 'Khách hàng'}</span>
                    </div>
                </NavLink>

                <AccountNavigation user={user} />
            </aside>

            <main className="chats-main overflow-hidden">
                <section className="conversation-panel d-flex flex-column overflow-hidden h-100">
                    <header className="conversation-heading">
                        <h1>Trò chuyện</h1>
                        <button type="button" aria-label="Tùy chọn">•••</button>
                    </header>

                    <label className="conversation-search">
                        <span aria-hidden="true">⌕</span>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Tìm kiếm cuộc trò chuyện"
                        />
                    </label>

                    <div className="conversation-filters" aria-label="Bộ lọc trò chuyện">
                        <button
                            type="button"
                            className={conversationFilter === 'ALL' ? 'active' : ''}
                            onClick={() => setConversationFilter('ALL')}
                        >
                            Tất cả
                        </button>
                        <button
                            type="button"
                            className={conversationFilter === 'UNREAD' ? 'active' : ''}
                            onClick={() => setConversationFilter('UNREAD')}
                        >
                            Chưa đọc
                        </button>
                    </div>

                    <div className="conversation-list flex-grow-1 overflow-y-auto">
                        {loading && <p className="conversation-state">Đang tải cuộc trò chuyện...</p>}
                        {!loading && error && <p className="conversation-state is-error">{error}</p>}
                        {!loading && !error && filteredConversations.length === 0 && (
                            <p className="conversation-state">
                                {conversationFilter === 'UNREAD'
                                    ? 'Không có cuộc trò chuyện chưa đọc.'
                                    : 'Chưa có cuộc trò chuyện nào.'}
                            </p>
                        )}
                        {filteredConversations.map((conversation) => (
                            <button
                                type="button"
                                className={`conversation-item${String(selectedId) === String(conversation.id) ? ' active' : ''}${Number(conversation.unreadCount || 0) > 0 ? ' is-unread' : ''}`}
                                key={conversation.id}
                                onClick={() => setSelectedId(conversation.id)}
                            >
                                <span className="conversation-avatar">
                                    {conversation.avatarUrl
                                        ? <img src={conversation.avatarUrl} alt="" />
                                        : initialsOf(conversation.name)}
                                    <i aria-label="Đang hoạt động" />
                                </span>
                                <span className="conversation-summary">
                                    <strong>{conversation.name || 'Người dùng'}</strong>
                                    <small>
                                        {conversation.latestMessage || 'Bắt đầu cuộc trò chuyện'}
                                        {conversation.latestMessageSentAt
                                            ? ` · ${relativeTime(conversation.latestMessageSentAt)}`
                                            : ''}
                                    </small>
                                </span>
                                {Number(conversation.unreadCount || 0) > 0 && (
                                    <b className="conversation-unread-count">
                                        {conversation.unreadCount > 99
                                            ? '99+' : conversation.unreadCount}
                                    </b>
                                )}
                            </button>
                        ))}
                        {!query && conversationFilter === 'ALL' && hasMoreConversations && (
                            <button
                                type="button"
                                className="conversation-load-more"
                                disabled={loadingMoreConversations}
                                onClick={loadMoreConversations}
                            >
                                {loadingMoreConversations ? 'Đang tải...' : 'Tải thêm'}
                            </button>
                        )}
                    </div>
                </section>

                {selectedConversation ? (
                    <section className="conversation-thread d-flex flex-column overflow-hidden h-100">
                        <header className="conversation-thread-header">
                            <span className="conversation-avatar">
                                {selectedConversation.avatarUrl
                                    ? <img src={selectedConversation.avatarUrl} alt="" />
                                    : initialsOf(selectedConversation.name)}
                            </span>
                            <strong>{selectedConversation.name || 'Người dùng'}</strong>
                            {conversationBlocked && !selectedConversation.blockedByCurrentUser ? (
                                <span className="conversation-blocked-label">Bạn đã bị chặn</span>
                            ) : (
                                <button
                                    type="button"
                                    className="conversation-block-action"
                                    disabled={conversationActionLoading}
                                    onClick={toggleConversationBlock}
                                >
                                    {conversationActionLoading
                                        ? 'Đang xử lý...'
                                        : conversationBlocked ? 'Bỏ chặn' : 'Chặn'}
                                </button>
                            )}
                        </header>

                        <div
                            className="conversation-messages flex-grow-1 overflow-y-auto"
                            ref={messagesContainerRef}
                            onScroll={handleMessagesScroll}
                        >
                            {messagesLoading && (
                                <p className="conversation-message-state">
                                    Đang tải tin nhắn...
                                </p>
                            )}
                            {!messagesLoading && messages.length === 0 && !messageError && (
                                <p className="conversation-message-state">
                                    Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.
                                </p>
                            )}
                            {messages.map((message) => {
                                const isMine = String(message.senderId)
                                    === String(currentUserId);
                                return (
                                    <div key={message.id}
                                        className={`conversation-message${isMine ? ' is-mine' : ''}`}>
                                        {!isMine && (
                                            <span className="conversation-message-avatar">
                                                {selectedConversation.avatarUrl
                                                    ? <img src={selectedConversation.avatarUrl} alt="" />
                                                    : initialsOf(selectedConversation.name)}
                                            </span>
                                        )}
                                        <div className="conversation-message-content">
                                            {editingId === message.id ? (
                                                <form
                                                    className="conversation-message-edit"
                                                    onSubmit={(event) => (
                                                        submitEditedMessage(event, message)
                                                    )}
                                                >
                                                    <input
                                                        value={editingContent}
                                                        onChange={(event) => (
                                                            setEditingContent(event.target.value)
                                                        )}
                                                        maxLength={2000}
                                                        autoFocus
                                                        disabled={messageActionId === message.id}
                                                        aria-label="Nội dung tin nhắn chỉnh sửa"
                                                    />
                                                    <span>
                                                        <button type="submit"
                                                            disabled={!editingContent.trim()
                                                                || messageActionId === message.id}>
                                                            Lưu
                                                        </button>
                                                        <button type="button"
                                                            onClick={cancelEditingMessage}
                                                            disabled={messageActionId === message.id}>
                                                            Hủy
                                                        </button>
                                                    </span>
                                                </form>
                                            ) : (
                                                <>
                                                    <p className={message.hidden
                                                        || message.note === 'Đã thu hồi'
                                                        ? 'is-recalled' : ''}>
                                                        {message.hidden
                                                            || message.note === 'Đã thu hồi'
                                                            ? 'Tin nhắn đã được thu hồi'
                                                            : message.content}
                                                    </p>
                                                    {message.note && (
                                                        <small className="conversation-message-note">
                                                            {message.note}
                                                        </small>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {isMine && !message.hidden
                                            && message.note !== 'Đã thu hồi'
                                            && editingId !== message.id && (
                                            <span className="conversation-message-actions">
                                                <button type="button"
                                                    onClick={() => startEditingMessage(message)}
                                                    disabled={Boolean(messageActionId)}>
                                                    Sửa
                                                </button>
                                                <button type="button"
                                                    onClick={() => removeMessage(message)}
                                                    disabled={Boolean(messageActionId)}>
                                                    Xóa
                                                </button>
                                            </span>
                                            )}
                                    </div>
                                );
                            })}
                        </div>

                        {messageError && (
                            <p className="conversation-compose-error">{messageError}</p>
                        )}
                        <form className="conversation-compose flex-shrink-0" onSubmit={submitMessage}>
                            <input value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={conversationBlocked
                                    ? 'Cuộc trò chuyện đã bị chặn'
                                    : 'Nhập tin nhắn...'}
                                maxLength={2000}
                                disabled={sending || conversationBlocked}
                                aria-label="Nội dung tin nhắn" />
                            <button type="submit"
                                disabled={!draft.trim() || sending || conversationBlocked}>
                                {sending ? 'Đang gửi...' : 'Gửi'}
                            </button>
                        </form>
                    </section>
                ) : (
                    <section className="conversation-empty">
                        <span>◌</span>
                        <h2>Chọn một cuộc trò chuyện</h2>
                        <p>Tin nhắn của bạn sẽ hiển thị tại đây.</p>
                    </section>
                )}
            </main>
        </div>
    );
}

export default Chats;
