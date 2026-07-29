import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { cancelMyRentalRequest, getMyRentalRequests } from '../services/rentalService';
import { getMyProfile } from '../services/userService';
import AccountMenuIcon from '../components/AccountMenuIcon';
import ChatNavLink from '../components/ChatNavLink';
import NotificationNavLink from '../components/NotificationNavLink';

const statusLabels = {
    PENDING: 'Đang chờ duyệt',
    APPROVED: 'Đã chấp nhận',
    CANCELLED: 'Đã hủy',
    REJECTED: 'Đã từ chối',
    EXPIRED: 'Đã hết hạn',
    TERMINATED: 'Đã kết thúc',
};

function formatDate(value, includeTime = false) {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN', includeTime
        ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : undefined);
}

function CustomerRentalRequests() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        let active = true;
        Promise.all([getMyProfile(), getMyRentalRequests()])
            .then(([profileData, requestData]) => {
                if (!active) return;
                setProfile(profileData);
                setRequests(Array.isArray(requestData) ? requestData : []);
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const displayName = profile?.fullName || user?.username || 'Khách hàng';
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((word) => word[0]).join('').toUpperCase();
    const counts = useMemo(() => requests.reduce((result, request) => ({
        ...result,
        [request.status]: (result[request.status] || 0) + 1,
    }), {}), [requests]);
    const filteredRequests = filter === 'ALL'
        ? requests
        : requests.filter((request) => request.status === filter);

    const cancelRequest = async (request) => {
        if (!window.confirm(`Bạn có chắc muốn hủy yêu cầu thuê “${request.roomName || `phòng #${request.roomId}`}”?`)) return;
        setCancellingId(request.id);
        setError('');
        setMessage('');
        try {
            await cancelMyRentalRequest(request.id);
            setRequests((current) => current.map((item) => item.id === request.id
                ? { ...item, status: 'CANCELLED' } : item));
            setMessage('Đã hủy yêu cầu thuê trọ.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="profile-shell customer-request-shell">
            <aside className="profile-sidebar">
                <div className="profile-sidebar-user">
                    <div className="profile-avatar">{profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" /> : <span>{initials}</span>}</div>
                    <div><strong>{displayName}</strong><span>Khách hàng</span></div>
                </div>
                <nav aria-label="Menu tài khoản">
                    <NavLink to="/dashboard"><AccountMenuIcon name="home" /> Trang chủ</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" /> Thông tin cá nhân</NavLink>
                    <NavLink to="/yeu-cau-thue-tro" className="active"><AccountMenuIcon name="requests" /> Yêu cầu thuê trọ</NavLink>
                    <ChatNavLink />
                    <NotificationNavLink />
                </nav>
            </aside>

            <main className="customer-request-main">
                <header className="customer-request-heading">
                    <div><p>TÀI KHOẢN KHÁCH HÀNG</p><h1>Yêu cầu thuê trọ</h1>
                        <span>Theo dõi và quản lý các yêu cầu thuê phòng đã gửi</span></div>
                    <NavLink to="/phong-tro">＋ Tìm phòng trọ</NavLink>
                </header>
                {(error || message) && <div className={`profile-alert ${error ? 'is-error' : 'is-success'}`}>
                    {error || message}</div>}

                <section className="customer-request-stats">
                    <article><span>Tổng yêu cầu</span><strong>{requests.length}</strong></article>
                    <article><span>Đang chờ duyệt</span><strong>{counts.PENDING || 0}</strong></article>
                    <article><span>Đã chấp nhận</span><strong>{counts.APPROVED || 0}</strong></article>
                    <article><span>Đã hủy/Từ chối</span><strong>{(counts.CANCELLED || 0) + (counts.REJECTED || 0)}</strong></article>
                </section>

                <section className="customer-request-card">
                    <div className="customer-request-toolbar">
                        <h2>Danh sách yêu cầu</h2>
                        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="PENDING">Đang chờ duyệt</option>
                            <option value="APPROVED">Đã chấp nhận</option>
                            <option value="CANCELLED">Đã hủy</option>
                            <option value="REJECTED">Đã từ chối</option>
                            <option value="EXPIRED">Đã hết hạn</option>
                        </select>
                    </div>

                    {loading ? <div className="customer-request-empty">Đang tải yêu cầu thuê trọ...</div>
                        : filteredRequests.length === 0 ? <div className="customer-request-empty">
                            <span>▣</span><h3>{requests.length ? 'Không có yêu cầu ở trạng thái này' : 'Bạn chưa gửi yêu cầu thuê trọ nào'}</h3>
                            <p>Chọn một phòng còn trống và gửi yêu cầu để theo dõi tại đây.</p>
                            {!requests.length && <NavLink to="/phong-tro">Tìm phòng ngay</NavLink>}
                        </div> : <div className="customer-request-list">
                            {filteredRequests.map((request) => <article key={request.id}>
                                <div className="customer-request-room-icon">⌂</div>
                                <div className="customer-request-content">
                                    <div><span>Yêu cầu #{request.id}</span>
                                        <b className={`request-status status-${String(request.status).toLowerCase()}`}>
                                            {statusLabels[request.status] || request.status}</b></div>
                                    <h3>{request.roomName || `Phòng #${request.roomId}`}</h3>
                                    <dl>
                                        <div><dt>Ngày bắt đầu</dt><dd>{formatDate(request.startDate)}</dd></div>
                                        <div><dt>Ngày kết thúc</dt><dd>{formatDate(request.endDate)}</dd></div>
                                        <div><dt>Ngày gửi yêu cầu</dt><dd>{formatDate(request.createdAt, true)}</dd></div>
                                    </dl>
                                </div>
                                <div className="customer-request-actions">
                                    <NavLink to={`/phong-tro`}>Xem phòng</NavLink>
                                    {request.status === 'PENDING' && <button type="button"
                                        disabled={cancellingId === request.id} onClick={() => cancelRequest(request)}>
                                        {cancellingId === request.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                                    </button>}
                                </div>
                            </article>)}
                        </div>}
                </section>
            </main>
        </div>
    );
}

export default CustomerRentalRequests;
