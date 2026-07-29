import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AccountMenuIcon from './AccountMenuIcon';
import { getMyConversations } from '../services/conversationService';

export const CHAT_UNREAD_CHANGED_EVENT = 'chat-unread-changed';

function ChatNavLink() {
    const [unreadCount, setUnreadCount] = useState(0);

    const loadUnreadCount = useCallback(() => {
        getMyConversations()
            .then((conversations) => setUnreadCount(
                conversations.reduce(
                    (total, conversation) => (
                        total + Number(conversation.unreadCount || 0)
                    ),
                    0,
                ),
            ))
            .catch(() => {
                // Trang trò chuyện sẽ hiển thị lỗi API chi tiết khi được mở.
            });
    }, []);

    useEffect(() => {
        loadUnreadCount();
        window.addEventListener(CHAT_UNREAD_CHANGED_EVENT, loadUnreadCount);
        return () => window.removeEventListener(
            CHAT_UNREAD_CHANGED_EVENT,
            loadUnreadCount,
        );
    }, [loadUnreadCount]);

    return (
        <NavLink to="/chats">
            <AccountMenuIcon name="chat" />
            <span className="owner-menu-label">Trò chuyện</span>
            {unreadCount > 0 && (
                <b className="chat-unread-badge"
                    aria-label={`${unreadCount} tin nhắn chưa đọc`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                </b>
            )}
        </NavLink>
    );
}

export default ChatNavLink;
