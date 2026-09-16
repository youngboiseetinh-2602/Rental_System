import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getAdminUsers, updateAdminUserStatus } from '../services/adminService';
import { sendAdminNotification } from '../services/notificationService';

const labels = { ADMIN: 'Quản trị viên', OWNER: 'Chủ trọ', CUSTOMER: 'Khách thuê', ACTIVE: 'Hoạt động', INACTIVE: 'Tạm ngưng', LOCKED: 'Đã khóa' };

function AdminUsers() {
    const [searchParams] = useSearchParams();
    const initialRole = searchParams.get('role') || '';
    const initialStatus = searchParams.get('status') || '';
    const [filters, setFilters] = useState({ citizenCode: '', role: initialRole, status: initialStatus });
    const [applied, setApplied] = useState({
        role: initialRole,
        status: initialStatus,
        excludeRole: 'ADMIN',
    });
    const [page, setPage] = useState(0);
    const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(null);
    const [notice, setNotice] = useState({ type: '', text: '' });
    const firstFilterRender = useRef(true);
    const [recipient, setRecipient] = useState(null);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationContent, setNotificationContent] = useState('');
    const [notificationError, setNotificationError] = useState('');
    const [sending, setSending] = useState(false);
    const sendingRef = useRef(false);
    const composeRef = useRef(null);
    useEffect(() => {
        if (recipient) {
            composeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            composeRef.current?.querySelector('input')?.focus();
        }
    }, [recipient]);
    const openNotification = user => {
        setRecipient(user);
        setNotificationTitle('');
        setNotificationContent('');
        setNotificationError('');
    };
    const sendNotification = async event => {
        event.preventDefault();
        if (!recipient || sendingRef.current) return;
        if (!notificationTitle.trim() || !notificationContent.trim()) {
            setNotificationError('Vui lòng nhập tiêu đề và nội dung.');
            return;
        }
        sendingRef.current = true;
        setSending(true);
        setNotificationError('');
        try {
            await sendAdminNotification(recipient.id, {
                title: notificationTitle.trim(), content: notificationContent.trim(),
            });
            setNotice({ type: 'success', text: `Đã gửi thông báo đến ${recipient.fullName || recipient.username}.` });
            setRecipient(null);
        } catch (error) {
            setNotificationError(error.message);
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };
    const load = useCallback(() => {
        setLoading(true);
        getAdminUsers({ ...applied, page, size: 10, sort: 'id,desc' }).then(setResult)
            .catch((e) => setNotice({ type: 'error', text: e.message })).finally(() => setLoading(false));
    }, [applied, page]);
    useEffect(load, [load]);
    useEffect(() => {
        if (firstFilterRender.current) {
            firstFilterRender.current = false;
            return undefined;
        }
        const timeout = window.setTimeout(() => {
            setPage(0);
            setApplied({
                citizenCode: filters.citizenCode.trim(),
                role: filters.role,
                status: filters.status,
                excludeRole: 'ADMIN',
            });
        }, 350);
        return () => window.clearTimeout(timeout);
    }, [filters]);
    const search = (e) => {
        e.preventDefault();
        setPage(0);
        setApplied({
            ...filters,
            citizenCode: filters.citizenCode.trim(),
            excludeRole: 'ADMIN',
        });
    };
    const changeStatus = async (user, status) => {
        setBusy(user.id); setNotice({ type: '', text: '' });
        try { await updateAdminUserStatus(user.id, status); setNotice({ type: 'success', text: `Đã cập nhật @${user.username}.` }); load(); }
        catch (e) { setNotice({ type: 'error', text: e.message }); } finally { setBusy(null); }
    };
    return (
        <AdminLayout title="Danh sách người dùng" description="Quản lý tập trung tài khoản chủ trọ, khách thuê và quản trị viên.">
            <section className="admin-card admin-filter-card"><form onSubmit={search}>
                <label><span>Mã căn cước</span><input placeholder="Nhập CCCD để tìm kiếm" value={filters.citizenCode} onChange={(e) => setFilters({ ...filters, citizenCode: e.target.value })} /></label>
                <label><span>Vai trò</span><select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}><option value="">Chủ trọ và khách thuê</option><option value="CUSTOMER">Khách thuê</option><option value="OWNER">Chủ trọ</option></select></label>
                <label><span>Trạng thái</span><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Tạm ngưng</option><option value="LOCKED">Đã khóa</option></select></label>
                <button className="admin-primary" type="submit">Tìm kiếm</button>
            </form></section>
            {notice.text && <div className={`admin-alert ${notice.type}`}>{notice.text}</div>}
            {recipient && <section className="admin-card p-4 mb-4" ref={composeRef}>
                <h2 className="h5">Gửi thông báo</h2>
                <p>Người nhận: <strong>{recipient.fullName || recipient.username}</strong> · @{recipient.username}</p>
                {notificationError && <div className="admin-alert error" role="alert">{notificationError}</div>}
                <form onSubmit={sendNotification} aria-busy={sending}>
                    <fieldset disabled={sending}>
                        <label className="form-label" htmlFor="user-notification-title">Tiêu đề</label>
                        <input id="user-notification-title" className="form-control mb-3" required maxLength={150}
                            value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)} />
                        <label className="form-label" htmlFor="user-notification-content">Nội dung</label>
                        <textarea id="user-notification-content" className="form-control mb-3" rows={5} required maxLength={2000}
                            value={notificationContent} onChange={e => setNotificationContent(e.target.value)} />
                        <button type="submit" className="btn btn-success">{sending ? 'Đang gửi…' : 'Gửi'}</button>
                        <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => setRecipient(null)}>Đóng</button>
                    </fieldset>
                </form>
            </section>}
            <section className="admin-card admin-list-card">
                <div className="admin-card-heading"><div><span>DANH SÁCH TÀI KHOẢN</span><h2>{result.totalElements || 0} người dùng</h2></div><button type="button" onClick={load}>↻ Làm mới</button></div>
                <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Người dùng</th><th>CCCD</th><th>Vai trò</th><th>Trạng thái</th><th>Quản lý truy cập</th><th>Gửi thông báo</th></tr></thead><tbody>
                    {result.content?.map((user) => <tr key={user.id}><td><div className="admin-user-cell"><i>{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : (user.fullName || user.username || 'U')[0]}</i><span><strong>{user.fullName || 'Chưa cập nhật'}</strong><small>@{user.username} · {user.phoneNumber || 'Chưa có SĐT'}</small></span></div></td><td>{user.citizenCode || '—'}</td><td><b className={`admin-role ${String(user.role).toLowerCase()}`}>{labels[user.role]}</b></td><td><b className={`admin-status ${String(user.status).toLowerCase()}`}>{labels[user.status]}</b></td><td><select value={user.status} disabled={busy === user.id || user.role === 'ADMIN'} onChange={(e) => changeStatus(user, e.target.value)}><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Tạm ngưng</option><option value="LOCKED">Khóa tài khoản</option></select></td><td><button type="button" className="btn btn-outline-success btn-sm" disabled={sending} onClick={() => openNotification(user)}>Gửi thông báo</button></td></tr>)}
                    {!loading && !result.content?.length && <tr><td colSpan="6" className="admin-empty">Không tìm thấy tài khoản phù hợp.</td></tr>}{loading && <tr><td colSpan="6" className="admin-empty">Đang tải dữ liệu...</td></tr>}
                </tbody></table></div>
                <div className="admin-pagination"><span>Trang {result.totalPages ? page + 1 : 0} / {result.totalPages || 0}</span><div><button disabled={!page} onClick={() => setPage(page - 1)}>← Trước</button><button disabled={page + 1 >= result.totalPages} onClick={() => setPage(page + 1)}>Sau →</button></div></div>
            </section>
        </AdminLayout>
    );
}
export default AdminUsers;
