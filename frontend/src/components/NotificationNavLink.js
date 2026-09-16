import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AccountMenuIcon from './AccountMenuIcon';
import useAuth from '../hooks/useAuth';
import { userHasRole } from '../utils/authRouting';
import { getMyNotifications } from '../services/notificationService';

export const NOTIFICATION_UNREAD_CHANGED_EVENT =
    'notification-unread-changed';

function NotificationNavLink() {
    const { user } = useAuth();
    const isAdmin = userHasRole(user, 'ADMIN');
    const [unreadCount, setUnreadCount] = useState(0);

    const loadUnreadCount = useCallback(() => {
        if (isAdmin) return;
        getMyNotifications()
            .then((notifications) => setUnreadCount(
                notifications.filter(
                    (notification) => notification.status === 'UNREAD',
                ).length,
            ))
            .catch(() => {
                // Trang thông báo sẽ hiển thị lỗi API chi tiết khi được mở.
            });
    }, [isAdmin]);

    useEffect(() => {
        loadUnreadCount();
        window.addEventListener(
            NOTIFICATION_UNREAD_CHANGED_EVENT,
            loadUnreadCount,
        );
        return () => window.removeEventListener(
            NOTIFICATION_UNREAD_CHANGED_EVENT,
            loadUnreadCount,
        );
    }, [loadUnreadCount]);

    return (
        <NavLink to="/notifications">
            <AccountMenuIcon name="notifications" />
            <span className="owner-menu-label">Thông báo</span>
            {!isAdmin && unreadCount > 0 && (
                <b className="notification-menu-badge"
                    aria-label={`${unreadCount} thông báo chưa đọc`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                </b>
            )}
        </NavLink>
    );
}

export default NotificationNavLink;
