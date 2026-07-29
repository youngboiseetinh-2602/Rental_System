import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getMyConversations } from '../services/conversationService';
import { getMyProfile } from '../services/userService';
import { userHasRole } from '../utils/authRouting';
import AccountMenuIcon from '../components/AccountMenuIcon';

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

function Chats() {
    const { user } = useAuth();
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(location.state?.otherUserId || null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isOwner = userHasRole(user, 'OWNER');

    useEffect(() => {
        let active = true;
        Promise.all([getMyProfile(), getMyConversations()])
            .then(([profileData, conversationData]) => {
                if (!active) return;
                setProfile(profileData);
                setConversations(conversationData);
                const requestedUserId = location.state?.otherUserId;
                const requestedConversation = conversationData.find(
                    (conversation) => String(conversation.otherUserId) === String(requestedUserId),
                );
                setSelectedId(requestedConversation?.id || conversationData[0]?.id || null);
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [location.state]);

    const filteredConversations = useMemo(() => {
        const keyword = query.trim().toLocaleLowerCase('vi');
        if (!keyword) return conversations;
        return conversations.filter((conversation) => (
            conversation.name?.toLocaleLowerCase('vi').includes(keyword)
            || conversation.latestMessage?.toLocaleLowerCase('vi').includes(keyword)
        ));
    }, [conversations, query]);

    const username = profile?.fullName || user?.name || user?.username || 'Người dùng';

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
                        <span>{isOwner ? 'Chủ trọ' : 'Khách hàng'}</span>
                    </div>
                </NavLink>

                <nav aria-label="Menu tài khoản">
                    <NavLink to={isOwner ? '/owner/dashboard' : '/dashboard'}><AccountMenuIcon name="home" /> Trang chủ</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" /> Thông tin cá nhân</NavLink>
                    <NavLink to={isOwner ? '/owner/rental-requests' : '/yeu-cau-thue-tro'}>
                        <AccountMenuIcon name="requests" /> Yêu cầu thuê trọ
                    </NavLink>
                    <NavLink to="/chats" className="active"><AccountMenuIcon name="chat" /> Trò chuyện</NavLink>
                    <NavLink to="/notifications"><AccountMenuIcon name="notifications" /> Thông báo</NavLink>
                </nav>
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
                        <button type="button" className="active">Tất cả</button>
                        <button type="button">Chưa đọc</button>
                        <button type="button">Nhóm</button>
                    </div>

                    <div className="conversation-list">
                        {loading && <p className="conversation-state">Đang tải cuộc trò chuyện...</p>}
                        {!loading && error && <p className="conversation-state is-error">{error}</p>}
                        {!loading && !error && filteredConversations.length === 0 && (
                            <p className="conversation-state">Chưa có cuộc trò chuyện nào.</p>
                        )}
                        {filteredConversations.map((conversation) => (
                            <button
                                type="button"
                                className={`conversation-item${selectedId === conversation.id ? ' active' : ''}`}
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
                            </button>
                        ))}
                    </div>
                </section>

                <section className="conversation-empty">
                    <span>◌</span>
                    <h2>Chọn một cuộc trò chuyện</h2>
                    <p>Tin nhắn của bạn sẽ hiển thị tại đây.</p>
                </section>
            </main>
        </div>
    );
}

export default Chats;
