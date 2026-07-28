import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import useAuth from '../hooks/useAuth';
import { getMyProfile } from '../services/userService';
import { getOwnerProperties, getOwnerRentalRequests } from '../services/ownerService';

function OwnerIcon({ children }) {
    return <span className="owner-menu-icon" aria-hidden="true">{children}</span>;
}

function OwnerDashboard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [properties, setProperties] = useState([]);
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([getMyProfile(), getOwnerProperties(), getOwnerRentalRequests()])
            .then(([profileData, propertyData, requestData]) => {
                setProfile(profileData);
                setProperties(Array.isArray(propertyData) ? propertyData : []);
                setRequests(Array.isArray(requestData) ? requestData : []);
            })
            .catch((requestError) => setError(requestError.message));
    }, []);

    const displayName = profile?.fullName || user?.username || 'Chủ trọ';
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((word) => word[0]).join('').toUpperCase();
    const pendingCount = requests.filter((item) => item.status === 'PENDING').length;
    const acceptedCount = requests.filter((item) => item.status === 'APPROVED').length;
    const recentRequests = useMemo(() => requests.slice(0, 5), [requests]);

    return (
        <div className="owner-dashboard">
            <aside className="owner-sidebar">
                <NavLink className="owner-brand" to="/owner/dashboard">⌂ <span>RentalRoom</span></NavLink>
                <NavLink className="owner-profile" to="/profile">
                    <span className="owner-avatar">
                        {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials}
                    </span>
                    <span><strong>{displayName}</strong><small>Chủ trọ</small></span>
                </NavLink>
                <nav>
                    <NavLink to="/owner/dashboard" end><OwnerIcon>⌂</OwnerIcon>Tổng quan</NavLink>
                    <NavLink to="/profile"><OwnerIcon>♙</OwnerIcon>Thông tin cá nhân</NavLink>
                    <NavLink to="/owner/properties"><OwnerIcon>▤</OwnerIcon>Danh sách phòng trọ</NavLink>
                    <NavLink to="/owner/properties/new"><OwnerIcon>＋</OwnerIcon>Tạo phòng trọ</NavLink>
                    <OwnerRentalRequestNavLink icon={<OwnerIcon>□</OwnerIcon>} />
                    <a href="#contracts"><OwnerIcon>▣</OwnerIcon>Hợp đồng thuê</a>
                    <a href="#messages"><OwnerIcon>◌</OwnerIcon>Trò chuyện</a>
                    <NavLink to="/notifications"><OwnerIcon>♢</OwnerIcon>Thông báo</NavLink>
                </nav>
            </aside>

            <main className="owner-main">
                <div className="owner-heading">
                    <div><p>TRANG QUẢN LÝ CHỦ TRỌ</p><h1>Tổng quan</h1></div>
                    <div className="owner-date">01/07/2026 - 31/07/2026　▣</div>
                </div>
                {error && <div className="profile-alert is-error">{error}</div>}

                <section className="owner-stat-grid">
                    <NavLink to="/owner/properties" aria-label="Xem danh sách phòng trọ">
                        <article><span>Phòng trọ</span><strong>{properties.length}</strong>
                            <small>↑ Tổng số cơ sở đang quản lý</small></article>
                    </NavLink>
                    <NavLink to="/owner/rental-requests" aria-label="Xem tất cả yêu cầu thuê">
                        <article><span>Yêu cầu thuê</span><strong>{requests.length}</strong>
                            <small>↑ Tất cả yêu cầu đã nhận</small></article>
                    </NavLink>
                    <NavLink to="/owner/rental-requests?status=PENDING"
                        aria-label="Xem yêu cầu đang chờ duyệt">
                        <article><span>Đang chờ duyệt</span><strong>{pendingCount}</strong>
                            <small>Yêu cầu cần xử lý</small></article>
                    </NavLink>
                    <NavLink to="/owner/rental-requests?status=APPROVED"
                        aria-label="Xem yêu cầu đã chấp nhận">
                        <article><span>Đã chấp nhận</span><strong>{acceptedCount}</strong>
                            <small>Hợp đồng tiềm năng</small></article>
                    </NavLink>
                </section>

                <section className="owner-dashboard-grid">
                    <article className="owner-panel owner-chart-panel">
                        <div className="owner-panel-title"><h2>Thống kê lượt quan tâm</h2><span>30 ngày qua</span></div>
                        <div className="owner-line-chart">
                            <div className="chart-grid-lines" />
                            <svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-label="Biểu đồ lượt quan tâm">
                                <polyline points="0,190 70,145 140,160 210,90 280,115 350,70 420,125 490,80 560,95 630,35 700,60" />
                                <polyline className="secondary" points="0,210 70,190 140,155 210,170 280,130 350,160 420,115 490,145 560,100 630,125 700,75" />
                            </svg>
                            <div className="chart-labels"><span>01/07</span><span>08/07</span><span>15/07</span><span>22/07</span><span>31/07</span></div>
                        </div>
                    </article>

                    <NavLink className="owner-panel owner-dashboard-link-panel"
                        to="/owner/rental-requests?status=PENDING" id="rental-requests">
                        <div className="owner-panel-title"><h2>Yêu cầu thuê trọ mới</h2><span>{pendingCount} đang chờ</span></div>
                        <div className="owner-request-list">
                            {recentRequests.length ? recentRequests.map((request) => (
                                <div key={request.id}>
                                    <span className="request-avatar">{(request.tenantName || 'K')[0]}</span>
                                    <span><strong>{request.tenantName || 'Khách thuê'}</strong><small>{request.roomName || `Phòng #${request.roomId}`}</small></span>
                                    <time>{request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : 'Mới'}</time>
                                    <b className={`owner-status ${String(request.status).toLowerCase()}`}>{request.status}</b>
                                </div>
                            )) : <p className="owner-empty">Chưa có yêu cầu thuê trọ mới.</p>}
                        </div>
                    </NavLink>

                    <NavLink className="owner-panel owner-dashboard-link-panel"
                        to="/owner/properties">
                        <div className="owner-panel-title"><h2>Phòng trọ theo trạng thái</h2></div>
                        <div className="owner-room-status">
                            <div className="owner-donut"><span>{properties.length}</span></div>
                            <ul>
                                <li><i className="green" />Đang hiển thị <strong>{properties.length}</strong></li>
                                <li><i className="blue" />Đã thuê <strong>{acceptedCount}</strong></li>
                                <li><i className="orange" />Đang ẩn <strong>0</strong></li>
                            </ul>
                        </div>
                    </NavLink>

                    <article className="owner-panel">
                        <div className="owner-panel-title"><h2>Doanh thu dự kiến</h2><span>Tháng này</span></div>
                        <strong className="owner-revenue">0 VNĐ</strong>
                        <div className="owner-bars">{[42, 58, 51, 72, 86].map((height, index) => (
                            <span key={height} style={{ height: `${height}%` }}><small>Tuần {index + 1}</small></span>
                        ))}</div>
                    </article>
                </section>
            </main>
        </div>
    );
}

export default OwnerDashboard;
