import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import AccountMenuIcon from '../components/AccountMenuIcon';
import ChatNavLink from '../components/ChatNavLink';
import NotificationNavLink from '../components/NotificationNavLink';
import useAuth from '../hooks/useAuth';
import { getOwnerRentalRequests, processOwnerRentalRequest } from '../services/ownerService';
import { getMyProfile } from '../services/userService';

const labels = {
    PENDING: 'Đang chờ duyệt', APPROVED: 'Đã chấp nhận', CANCELLED: 'Đã từ chối',
    EXPIRED: 'Đã hết hạn', TERMINATED: 'Đã kết thúc',
};

function date(value) {
    return value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
}

function OwnerRentalRequests() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const requestedStatus = searchParams.get('status');
    const [profile, setProfile] = useState(null);
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState(
        ['PENDING', 'APPROVED', 'CANCELLED'].includes(requestedStatus)
            ? requestedStatus : 'ALL',
    );
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [rejectingRequest, setRejectingRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([getMyProfile(), getOwnerRentalRequests()])
            .then(([profileData, requestData]) => {
                if (!active) return;
                setProfile(profileData);
                setRequests(Array.isArray(requestData) ? requestData : []);
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const displayName = profile?.fullName || user?.username || 'Chủ trọ';
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((word) => word[0]).join('').toUpperCase();
    const counts = useMemo(() => requests.reduce((result, request) => ({
        ...result, [request.status]: (result[request.status] || 0) + 1,
    }), {}), [requests]);
    const visible = filter === 'ALL' ? requests : requests.filter((item) => item.status === filter);

    const processRequest = async (request, status, reason = '') => {
        const action = status === 'APPROVED' ? 'chấp nhận' : 'từ chối';
        if (status === 'APPROVED'
            && !window.confirm(`Bạn có chắc muốn ${action} yêu cầu thuê ${request.roomName || `phòng #${request.roomId}`}?`)) return;
        setProcessingId(request.id);
        setError('');
        setMessage('');
        try {
            await processOwnerRentalRequest(request.id, status, reason);
            setRequests((current) => current.map((item) => item.id === request.id
                ? { ...item, status } : item));
            window.dispatchEvent(new Event('owner-rental-requests-updated'));
            setMessage(`Đã ${action} yêu cầu thuê trọ.`);
            setRejectingRequest(null);
            setRejectionReason('');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="owner-dashboard">
            <aside className="owner-sidebar">
                <NavLink className="owner-profile" to="/profile">
                    <span className="owner-avatar">{profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" /> : initials}</span>
                    <span><strong>{displayName}</strong><small>Chủ trọ</small></span>
                </NavLink>
                <nav>
                    <NavLink to="/owner/dashboard"><AccountMenuIcon name="home" />Tổng quan</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" />Thông tin cá nhân</NavLink>
                    <NavLink to="/owner/properties"><AccountMenuIcon name="properties" />Danh sách phòng trọ</NavLink>
                    <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" />Tạo phòng trọ</NavLink>
                    <OwnerRentalRequestNavLink icon={<AccountMenuIcon name="requests" />} />
                    <NavLink to="/owner/contracts"><AccountMenuIcon name="contract" />Hợp đồng thuê</NavLink>
                    <ChatNavLink />
                    <NotificationNavLink />
                </nav>
            </aside>

            <main className="owner-main owner-request-main">
                <header className="owner-properties-heading">
                    <div><p>QUẢN LÝ YÊU CẦU</p><h1>Yêu cầu thuê trọ</h1>
                        <span>Xem xét các yêu cầu thuê gửi đến phòng trọ của bạn</span></div>
                </header>
                {(error || message) && <div className={`profile-alert ${error ? 'is-error' : 'is-success'}`}>
                    {error || message}</div>}

                <section className="customer-request-stats">
                    <article><span>Tổng yêu cầu</span><strong>{requests.length}</strong></article>
                    <article><span>Đang chờ duyệt</span><strong>{counts.PENDING || 0}</strong></article>
                    <article><span>Đã chấp nhận</span><strong>{counts.APPROVED || 0}</strong></article>
                    <article><span>Đã từ chối</span><strong>{counts.CANCELLED || 0}</strong></article>
                </section>

                <section className="customer-request-card">
                    <div className="customer-request-toolbar">
                        <h2>Danh sách yêu cầu nhận được</h2>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="ALL">Tất cả trạng thái</option><option value="PENDING">Đang chờ duyệt</option>
                            <option value="APPROVED">Đã chấp nhận</option><option value="CANCELLED">Đã từ chối</option>
                        </select>
                    </div>
                    {loading ? <div className="customer-request-empty">Đang tải yêu cầu thuê trọ...</div>
                        : visible.length === 0 ? <div className="customer-request-empty">
                            <span>□</span><h3>Chưa có yêu cầu thuê trọ phù hợp</h3>
                            <p>Các yêu cầu mới của khách hàng sẽ xuất hiện tại đây.</p>
                        </div> : <div className="owner-rental-request-list">
                            {visible.map((request) => <article key={request.id}>
                                <span className="request-avatar">{(request.tenantName || 'K')[0]}</span>
                                <div className="owner-request-tenant">
                                    <small>Yêu cầu #{request.id}</small><h3>{request.tenantName || 'Khách thuê'}</h3>
                                    <p>{request.roomName || `Phòng #${request.roomId}`}</p>
                                </div>
                                <dl><div><dt>Bắt đầu</dt><dd>{date(request.startDate)}</dd></div>
                                    <div><dt>Kết thúc</dt><dd>{date(request.endDate)}</dd></div>
                                    <div><dt>Ngày gửi</dt><dd>{date(request.createdAt)}</dd></div></dl>
                                <b className={`request-status status-${String(request.status).toLowerCase()}`}>
                                    {labels[request.status] || request.status}</b>
                                <div className="owner-request-actions">
                                    {request.status === 'PENDING' ? <>
                                        <button type="button" disabled={processingId === request.id}
                                            onClick={() => {
                                                setRejectingRequest(request);
                                                setRejectionReason('');
                                            }}>Từ chối</button>
                                        <button type="button" disabled={processingId === request.id}
                                            onClick={() => processRequest(request, 'APPROVED')}>
                                            {processingId === request.id ? 'Đang xử lý...' : 'Chấp nhận'}</button>
                                    </> : <span>Đã xử lý</span>}
                                </div>
                            </article>)}
                        </div>}
                </section>
                {rejectingRequest && <div className="owner-rejection-modal" role="dialog"
                    aria-modal="true" aria-labelledby="rejection-dialog-title">
                    <button type="button" className="owner-rejection-backdrop"
                        aria-label="Đóng" onClick={() => setRejectingRequest(null)} />
                    <form className="owner-rejection-dialog" onSubmit={(event) => {
                        event.preventDefault();
                        processRequest(rejectingRequest, 'CANCELLED', rejectionReason.trim());
                    }}>
                        <h2 id="rejection-dialog-title">Từ chối yêu cầu thuê trọ</h2>
                        <p>Thông báo lý do từ chối cho {rejectingRequest.tenantName || 'khách thuê'}.</p>
                        <label htmlFor="rejection-reason">Lý do từ chối <span>*</span></label>
                        <textarea id="rejection-reason" value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            maxLength={500} rows={5} autoFocus required
                            placeholder="Ví dụ: Phòng đã được cho thuê trong khoảng thời gian này." />
                        <small>{rejectionReason.length}/500 ký tự</small>
                        <div>
                            <button type="button" disabled={processingId !== null}
                                onClick={() => setRejectingRequest(null)}>Hủy</button>
                            <button type="submit"
                                disabled={!rejectionReason.trim() || processingId !== null}>
                                {processingId !== null ? 'Đang gửi...' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </form>
                </div>}
            </main>
        </div>
    );
}

export default OwnerRentalRequests;
