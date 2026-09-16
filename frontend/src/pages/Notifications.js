import React, { useEffect, useMemo, useRef, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { getMyProfile } from '../services/userService';
import {
    getMyNotifications,
    markNotificationAsRead,
    broadcastNotification,
} from '../services/notificationService';
import { userHasRole } from '../utils/authRouting';
import {
    NOTIFICATION_UNREAD_CHANGED_EVENT,
} from '../components/NotificationNavLink';
import AccountNavigation from '../components/AccountNavigation';
import AdminLayout from '../components/AdminLayout';

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
    const [composing, setComposing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const sendingRef = useRef(false);
    const [sendError, setSendError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const isOwner = userHasRole(user, 'OWNER');
    const isAdmin = userHasRole(user, 'ADMIN');

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

    const sendBroadcast = async (event) => {
        event.preventDefault();
        if (!isAdmin || sendingRef.current) return;
        if (!title.trim() || !content.trim()) {
            setSendError('Vui lòng nhập tiêu đề và nội dung.');
            return;
        }
        sendingRef.current = true;
        setSending(true);
        setSendError('');
        setSuccess('');
        try {
            await broadcastNotification({ title: title.trim(), content: content.trim() });
            setSuccess('Gửi thông báo thành công');
            setTitle('');
            setContent('');
            setComposing(false);
            window.dispatchEvent(new Event(NOTIFICATION_UNREAD_CHANGED_EVENT));
            try {
                const data = await getMyNotifications();
                setNotifications((Array.isArray(data) ? data : [])
                    .sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0)));
                setFilter('ALL');
                setError('');
            } catch {
                setError('Thông báo đã gửi, nhưng chưa tải lại được danh sách. Vui lòng tải lại trang.');
            }
        } catch (requestError) {
            setSendError(requestError.message);
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    const displayName = profile?.fullName || user?.username
        || (isAdmin ? 'Quản trị viên' : isOwner ? 'Chủ trọ' : 'Khách hàng');
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((part) => part[0]).join('').toUpperCase();
    const unreadCount = notifications.filter((item) => item.status === 'UNREAD').length;
    const visibleNotifications = useMemo(() => notifications.filter((item) =>
        (filter === 'ALL' || item.status === filter)
        && (!isAdmin || `${item.title} ${item.content}`.toLocaleLowerCase('vi')
            .includes(search.trim().toLocaleLowerCase('vi')))),
    [filter, notifications, search, isAdmin]);

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
            window.dispatchEvent(
                new Event(NOTIFICATION_UNREAD_CHANGED_EVENT),
            );
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setReadingId(null);
        }
    };

    const pageContent = (<>
                {error && <div className="profile-alert is-error" role="alert">{error}</div>}
                {success && <div className="profile-alert" role="status">{success}</div>}

                {isAdmin && composing && (
                    <form id="broadcast-form" className="customer-request-card p-4 mb-4"
                        onSubmit={sendBroadcast} aria-busy={sending}>
                        <h2 className="h5">Tạo thông báo</h2>
                        <p className="text-secondary">Gửi đến tất cả tài khoản trong hệ thống, bao gồm cả bạn.</p>
                        {sendError && <div className="profile-alert is-error" role="alert">{sendError}</div>}
                        <fieldset disabled={sending} className="notification-compose-grid">
                            <div>
                            <label className="form-label" htmlFor="broadcast-title">Tiêu đề</label>
                            <input id="broadcast-title" className="form-control mb-3" required
                                maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} />
                            <label className="form-label" htmlFor="broadcast-content">Nội dung</label>
                            <textarea id="broadcast-content" className="form-control mb-3" required
                                rows={5} maxLength={2000} value={content}
                                onChange={(event) => setContent(event.target.value)} />
                            <button type="submit" className="btn btn-success">
                                {sending ? 'Đang gửi…' : 'Gửi cho tất cả'}
                            </button>
                            <button type="button" className="btn btn-outline-secondary ms-2"
                                onClick={() => setComposing(false)}>Đóng</button>
                            </div>
                            <aside className="notification-compose-preview">
                                <span className="badge text-bg-success mb-3">Tất cả người dùng</span>
                                <h3 className="h6">Xem trước thông báo</h3>
                                <strong>{title.trim() || 'Tiêu đề thông báo'}</strong>
                                <p>{content.trim() || 'Nội dung bạn nhập sẽ hiển thị tại đây.'}</p>
                                <small>Từ {displayName}</small>
                            </aside>
                        </fieldset>
                    </form>
                )}

                <section className="customer-request-stats notification-stats">
                    <article><span>{isAdmin ? 'Thông báo nhận được' : 'Tổng thông báo'}</span><strong>{notifications.length}</strong></article>
                    <article><span>Chưa đọc</span><strong>{unreadCount}</strong></article>
                    <article><span>Đã đọc</span>
                        <strong>{notifications.length - unreadCount}</strong></article>
                </section>

                <section className="customer-request-card">
                    <div className="customer-request-toolbar">
                        <div><h2>{isAdmin ? 'Hộp thư của bạn' : 'Danh sách thông báo'}</h2>{isAdmin && <small>Trạng thái đọc chỉ áp dụng cho tài khoản của bạn.</small>}</div>
                        <div className="notification-inbox-filters">
                        {isAdmin && <input type="search" className="form-control" value={search}
                            aria-label="Tìm thông báo" placeholder="Tìm theo tiêu đề, nội dung"
                            onChange={(event) => setSearch(event.target.value)} />}
                        <select aria-label="Lọc trạng thái thông báo" value={filter} onChange={(event) => setFilter(event.target.value)}>
                            <option value="ALL">Tất cả thông báo</option>
                            <option value="UNREAD">Chưa đọc</option>
                            <option value="READ">Đã đọc</option>
                        </select>
                        </div>
                    </div>

                    {loading ? <div className="customer-request-empty">Đang tải thông báo...</div>
                        : visibleNotifications.length === 0
                            ? <div className="customer-request-empty">
                                <span>♢</span>
                                <h3>{notifications.length
                                    ? 'Không có thông báo phù hợp'
                                    : 'Bạn chưa có thông báo nào'}</h3>
                                <p>{isAdmin ? 'Thông báo gửi đến bạn, bao gồm bản sao thông báo bạn gửi cho tất cả, sẽ xuất hiện tại đây.' : 'Các cập nhật về yêu cầu thuê trọ sẽ xuất hiện tại đây.'}</p>
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
</>
    );
    if (isAdmin) {
        return <AdminLayout title="Thông báo" description="Soạn thông báo gửi đến mọi người và theo dõi hộp thư của bạn."
            actions={<button type="button" className="btn btn-success" disabled={sending}
                aria-expanded={composing} aria-controls="broadcast-form"
                onClick={() => setComposing(!composing)}>Tạo thông báo</button>}>
            <div className="admin-notification-dashboard">{pageContent}</div>
        </AdminLayout>;
    }
    return (
        <div className="profile-shell notification-shell">
            <aside className="profile-sidebar">
                <div className="profile-sidebar-user">
                    <div className="profile-avatar">{profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" /> : <span>{initials}</span>}</div>
                    <div><strong>{displayName}</strong>
                        <span>{isAdmin ? 'Quản trị viên' : isOwner ? 'Chủ trọ' : 'Khách hàng'}</span></div>
                </div>
                <AccountNavigation user={user} />
            </aside>

            <main className="customer-request-main notification-main">
                <header className="customer-request-heading">
                    <div><p>TÀI KHOẢN CỦA BẠN</p><h1>Thông báo</h1>
                    <span>Theo dõi những cập nhật mới nhất từ RentalRoom</span></div>
                </header>
                {pageContent}
            </main>
        </div>
    );
}

export default Notifications;
