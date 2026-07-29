import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
    deleteConversationMessage,
    createConversation,
    editConversationMessage,
    getConversationMessages,
    getMyConversations,
    sendConversationMessage,
} from '../services/conversationService';
import { getMyProfile } from '../services/userService';
import { getAdminContact } from '../services/contactService';
import { userHasRole } from '../utils/authRouting';
import { CHAT_UNREAD_CHANGED_EVENT } from '../components/ChatNavLink';
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
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(location.state?.otherUserId || null);
    const [query, setQuery] = useState('');
    const [conversationFilter, setConversationFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [messageActionId, setMessageActionId] = useState(null);
    const messagesContainerRef = useRef(null);
    const previousMessageCountRef = useRef(0);
    const pendingInitialScrollRef = useRef(false);
    const isOwner = userHasRole(user, 'OWNER');
    const isAdmin = userHasRole(user, 'ADMIN');

    useEffect(() => {
        let active = true;
        Promise.all([
            getMyProfile(),
            getMyConversations(),
            getAdminContact().catch(() => null),
        ])
            .then(async ([profileData, conversationData, adminContact]) => {
                if (!active) return;
                setProfile(profileData);
                let currentConversations = pinAdminConversation(
                    conversationData,
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
                    currentConversations = pinAdminConversation(
                        await getMyConversations(),
                        adminContact?.id,
                    );
                    if (!active) return;
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
    }, [location.search, location.state]);

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
        if (!selectedId) {
            setMessages([]);
            previousMessageCountRef.current = 0;
            return undefined;
        }

        let active = true;
        setMessagesLoading(true);
        setMessageError('');
        getConversationMessages(selectedId)
            .then((data) => {
                if (!active) return;
                pendingInitialScrollRef.current = true;
                previousMessageCountRef.current = 0;
                setMessages([...data].reverse());
                setConversations((current) => current.map((conversation) => (
                    String(conversation.id) === String(selectedId)
                        ? { ...conversation, unreadCount: 0 }
                        : conversation
                )));
                window.dispatchEvent(new Event(CHAT_UNREAD_CHANGED_EVENT));
            })
            .catch((requestError) => active && setMessageError(requestError.message))
            .finally(() => active && setMessagesLoading(false));
        return () => { active = false; };
    }, [selectedId]);

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
    const currentUserId = profile?.id || user?.id || user?.userId || user?.sub;

    const submitMessage = async (event) => {
        event.preventDefault();
        const content = draft.trim();
        if (!content || !selectedId || sending) return;

        setSending(true);
        setMessageError('');
        try {
            const sentMessage = await sendConversationMessage(selectedId, content);
            setMessages((current) => [...current, sentMessage]);
            setDraft('');
            setConversations((current) => current.map((conversation) => (
                String(conversation.id) === String(selectedId)
                    ? {
                        ...conversation,
                        latestMessage: sentMessage.content,
                        latestMessageSentAt: sentMessage.sentAt,
                    }
                    : conversation
            )));
        } catch (requestError) {
            setMessageError(requestError.message);
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
        <div className="profile-shell chats-shell">
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

            <main className="chats-main">
                <section className="conversation-panel">
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

                    <div className="conversation-list">
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
                    </div>
                </section>

                {selectedConversation ? (
                    <section className="conversation-thread">
                        <header className="conversation-thread-header">
                            <span className="conversation-avatar">
                                {selectedConversation.avatarUrl
                                    ? <img src={selectedConversation.avatarUrl} alt="" />
                                    : initialsOf(selectedConversation.name)}
                            </span>
                            <strong>{selectedConversation.name || 'Người dùng'}</strong>
                        </header>

                        <div className="conversation-messages" ref={messagesContainerRef}>
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
                        <form className="conversation-compose" onSubmit={submitMessage}>
                            <input value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder="Nhập tin nhắn..."
                                maxLength={2000}
                                disabled={sending}
                                aria-label="Nội dung tin nhắn" />
                            <button type="submit"
                                disabled={!draft.trim() || sending}>
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
