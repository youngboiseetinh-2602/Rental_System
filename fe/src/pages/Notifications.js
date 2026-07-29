import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getMyProfile } from '../services/userService';
import {
    getMyNotifications,
    markNotificationAsRead,
} from '../services/notificationService';
import { userHasRole } from '../utils/authRouting';
import AccountMenuIcon from '../components/AccountMenuIcon';

function formatDate(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function Notifications() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [readingId, setReadingId] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [error, setError] = useState('');
    const isOwner = userHasRole(user, 'OWNER');

    useEffect(() => {
        let active = true;
        Promise.all([getMyProfile(), getMyNotifications()])
            .then(([profileData, notificationData]) => {
                if (!active) return;
                setProfile(profileData);
                setNotifications((Array.isArray(notificationData) ? notificationData : [])
                    .sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0)));
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const displayName = profile?.fullName || user?.username
        || (isOwner ? 'Chủ trọ' : 'Khách hàng');
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((part) => part[0]).join('').toUpperCase();
    const unreadCount = notifications.filter((item) => item.status === 'UNREAD').length;
    const visibleNotifications = useMemo(() => filter === 'ALL'
        ? notifications
        : notifications.filter((item) => item.status === filter),
    [filter, notifications]);

    const viewNotification = async (notification) => {
        setSelectedNotification(notification);
        if (notification.status === 'READ') return;
        setReadingId(notification.id);
        setError('');
        try {
            await markNotificationAsRead(notification.id);
            const readAt = new Date().toISOString();
            const readNotification = { ...notification, status: 'READ', readAt };
            setNotifications((current) => current.map((item) => item.id === notification.id
                ? readNotification : item));
            setSelectedNotification(readNotification);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setReadingId(null);
        }
    };

    return (
        <div className="profile-shell notification-shell">
            <aside className="profile-sidebar">
                <div className="profile-sidebar-user">
                    <div className="profile-avatar">{profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" /> : <span>{initials}</span>}</div>
                    <div><strong>{displayName}</strong>
                        <span>{isOwner ? 'Chủ trọ' : 'Khách hàng'}</span></div>
                </div>
                <nav aria-label="Menu tài khoản">
                    <NavLink to={isOwner ? '/owner/dashboard' : '/dashboard'}><AccountMenuIcon name="home" /> Trang chủ</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" /> Thông tin cá nhân</NavLink>
                    {isOwner && <NavLink to="/owner/properties"><AccountMenuIcon name="properties" /> Danh sách phòng trọ</NavLink>}
                    {isOwner && <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" /> Tạo phòng trọ</NavLink>}
                    <NavLink to={isOwner ? '/owner/rental-requests' : '/yeu-cau-thue-tro'}>
                        <AccountMenuIcon name="requests" /> Yêu cầu thuê trọ
                    </NavLink>
                    <NavLink to="/chats"><AccountMenuIcon name="chat" /> Trò chuyện</NavLink>
                    <NavLink to="/notifications" className="active"><AccountMenuIcon name="notifications" /> Thông báo
                        {unreadCount > 0 && <b className="notification-menu-badge">{unreadCount}</b>}
                    </NavLink>
                </nav>
            </aside>

            <main className="customer-request-main notification-main">
                <header className="customer-request-heading">
                    <div><p>TÀI KHOẢN CỦA BẠN</p><h1>Thông báo</h1>
                        <span>Theo dõi những cập nhật mới nhất từ RentalRoom</span></div>
                </header>

                {error && <div className="profile-alert is-error" role="alert">{error}</div>}

                <section className="customer-request-stats notification-stats">
                    <article><span>Tổng thông báo</span><strong>{notifications.length}</strong></article>
                    <article><span>Chưa đọc</span><strong>{unreadCount}</strong></article>
                    <article><span>Đã đọc</span>
                        <strong>{notifications.length - unreadCount}</strong></article>
                </section>

                <section className="customer-request-card">
                    <div className="customer-request-toolbar">
                        <h2>Danh sách thông báo</h2>
                        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                            <option value="ALL">Tất cả thông báo</option>
                            <option value="UNREAD">Chưa đọc</option>
                            <option value="READ">Đã đọc</option>
                        </select>
                    </div>

                    {loading ? <div className="customer-request-empty">Đang tải thông báo...</div>
                        : visibleNotifications.length === 0
                            ? <div className="customer-request-empty">
                                <span>♢</span>
                                <h3>{notifications.length
                                    ? 'Không có thông báo ở trạng thái này'
                                    : 'Bạn chưa có thông báo nào'}</h3>
                                <p>Các cập nhật về yêu cầu thuê trọ sẽ xuất hiện tại đây.</p>
                            </div>
                            : <div className="notification-list">
                                {visibleNotifications.map((notification) => (
                                    <article key={notification.id}
                                        className={notification.status === 'UNREAD' ? 'is-unread' : ''}>
                                        <span className="notification-icon">♢</span>
                                        <div className="notification-content">
                                            <div><h3>{notification.title}</h3>
                                                {notification.status === 'UNREAD'
                                                    && <i>Chưa đọc</i>}</div>
                                            <p>{notification.content}</p>
                                            <small>{notification.senderName
                                                ? `Từ ${notification.senderName} · ` : ''}
                                                {formatDate(notification.sentAt)}</small>
                                        </div>
                                        <button type="button"
                                            disabled={readingId === notification.id}
                                            onClick={() => viewNotification(notification)}>
                                            {readingId === notification.id
                                                ? 'Đang mở...' : 'Xem chi tiết'}
                                        </button>
                                    </article>
                                ))}
                            </div>}
                </section>
                {selectedNotification && (
                    <div className="notification-detail-modal" role="dialog"
                        aria-modal="true" aria-labelledby="notification-detail-title">
                        <button type="button" className="notification-detail-backdrop"
                            aria-label="Đóng chi tiết thông báo"
                            onClick={() => setSelectedNotification(null)} />
                        <section className="notification-detail-dialog">
                            <div className="notification-detail-heading">
                                <span className="notification-icon">♢</span>
                                <div>
                                    <small>THÔNG BÁO</small>
                                    <h2 id="notification-detail-title">
                                        {selectedNotification.title}
                                    </h2>
                                </div>
                                <button type="button" aria-label="Đóng"
                                    onClick={() => setSelectedNotification(null)}>×</button>
                            </div>
                            <p>{selectedNotification.content}</p>
                            <footer>
                                <span>{selectedNotification.senderName
                                    ? `Từ ${selectedNotification.senderName}` : 'Từ hệ thống'}</span>
                                <time>{formatDate(selectedNotification.sentAt)}</time>
                            </footer>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Notifications;
