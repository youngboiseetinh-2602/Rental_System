import React from 'react';
import { NavLink } from 'react-router-dom';
import AccountMenuIcon from './AccountMenuIcon';
import useChatRealtime from '../hooks/useChatRealtime';

function ChatNavLink() {
    const { unreadCount } = useChatRealtime();

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
