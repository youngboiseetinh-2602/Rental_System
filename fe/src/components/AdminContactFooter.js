import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { createConversation } from '../services/conversationService';
import { getAdminContact } from '../services/contactService';

function PhoneIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c1 .3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></svg>;
}

function ChatIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-4A8 8 0 1 1 21 15Z" /><path d="M8 10h8M8 14h5" /></svg>;
}

function AdminContactFooter() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [admin, setAdmin] = useState(null);
    const [error, setError] = useState('');
    const [startingChat, setStartingChat] = useState(false);
    const isAdminPage = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
    const isChatPage = location.pathname === '/chats';
    const isHiddenPage = isAdminPage || isChatPage;

    useEffect(() => {
        if (isHiddenPage) return undefined;
        let active = true;
        getAdminContact()
            .then((data) => active && setAdmin(data))
            .catch((requestError) => active && setError(requestError.message));
        return () => { active = false; };
    }, [isHiddenPage]);

    if (isHiddenPage) return null;

    const startChat = async () => {
        if (!admin?.id) return;
        if (!isAuthenticated) {
            const returnTo = `/chats?contact=${encodeURIComponent(admin.id)}`;
            navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
            return;
        }
        setStartingChat(true);
        setError('');
        try {
            await createConversation(admin.id);
            navigate('/chats', { state: { otherUserId: admin.id } });
        } catch (requestError) {
            setError(requestError.message);
            setStartingChat(false);
        }
    };

    return (
        <footer className="admin-contact-footer">
            <div className="admin-contact-inner">
                <div className="admin-contact-copy">
                    <span className="admin-contact-avatar">
                        {admin?.avatarUrl
                            ? <img src={admin.avatarUrl} alt="" />
                            : (admin?.fullName || 'A').charAt(0).toUpperCase()}
                    </span>
                    <div>
                        <p>HỖ TRỢ TỪ RENTALROOM</p>
                        <h2>Bạn cần hỗ trợ?</h2>
                        <span>Quản trị viên luôn sẵn sàng giải đáp và hỗ trợ bạn.</span>
                    </div>
                </div>
                <div className="admin-contact-actions">
                    {admin?.phoneNumber ? (
                        <a href={`tel:${admin.phoneNumber}`}><PhoneIcon /><span><small>Hotline hỗ trợ</small><strong>{admin.phoneNumber}</strong></span></a>
                    ) : <span className="admin-contact-unavailable">Chưa cập nhật số điện thoại</span>}
                    <button type="button" disabled={!admin?.id || startingChat} onClick={startChat}>
                        <ChatIcon />{startingChat ? 'Đang kết nối...' : 'Trò chuyện với Admin'}
                    </button>
                </div>
            </div>
            {error && <p className="admin-contact-error" role="alert">{error}</p>}
        </footer>
    );
}

export default AdminContactFooter;
