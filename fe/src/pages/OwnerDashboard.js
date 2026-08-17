import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import AccountMenuIcon from '../components/AccountMenuIcon';
import ChatNavLink from '../components/ChatNavLink';
import NotificationNavLink from '../components/NotificationNavLink';
import useAuth from '../hooks/useAuth';
import { getMyProfile } from '../services/userService';
import { getOwnerProperties, getOwnerRentalRequests } from '../services/ownerService';

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
    const recentProperties = useMemo(() => properties.slice(0, 5), [properties]);

    return (
        <div className="owner-dashboard">
            <aside className="owner-sidebar">
                <NavLink className="owner-profile" to="/profile">
                    <span className="owner-avatar">
                        {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials}
                    </span>
                    <span><strong>{displayName}</strong><small>Chủ trọ</small></span>
                </NavLink>
                <nav>
                    <NavLink to="/owner/dashboard" end><AccountMenuIcon name="home" />Tổng quan</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" />Thông tin cá nhân</NavLink>
                    <NavLink to="/owner/properties"><AccountMenuIcon name="properties" />Danh sách phòng trọ</NavLink>
                    <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" />Tạo phòng trọ</NavLink>
                    <OwnerRentalRequestNavLink icon={<AccountMenuIcon name="requests" />} />
                    <NavLink to="/owner/contracts"><AccountMenuIcon name="contract" />Hợp đồng thuê</NavLink>
                    <ChatNavLink />
                    <NotificationNavLink />
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
                    <article className="owner-panel owner-dashboard-properties">
                        <div className="owner-panel-title">
                            <h2>Danh sách nhà trọ</h2>
                            <NavLink to="/owner/properties">Xem tất cả</NavLink>
                        </div>
                        <div className="list-group list-group-flush mt-3">
                            {recentProperties.length ? recentProperties.map((property) => {
                                const address = property.detailedAddress || [
                                    property.houseNumber, property.street,
                                    property.ward, property.city,
                                ].filter(Boolean).join(', ');
                                return (
                                    <NavLink className="list-group-item list-group-item-action d-flex align-items-center gap-3 px-0"
                                        to={`/owner/properties/${property.id}`} key={property.id}>
                                        <span className="owner-dashboard-property-icon" aria-hidden="true">⌂</span>
                                        <span className="flex-grow-1 overflow-hidden">
                                            <strong className="d-block text-truncate">
                                                {property.name || 'Nhà trọ chưa đặt tên'}
                                            </strong>
                                            <small className="d-block text-truncate">
                                                {address || 'Chưa cập nhật địa chỉ'}
                                            </small>
                                        </span>
                                        <span className="badge rounded-pill text-bg-success">
                                            {property.rentalTypeName || 'Đang hiển thị'}
                                        </span>
                                    </NavLink>
                                );
                            }) : (
                                <div className="owner-empty py-5 text-center">
                                    <p>Bạn chưa có nhà trọ nào.</p>
                                    <NavLink className="btn btn-success btn-sm" to="/owner/properties/new">
                                        Tạo nhà trọ mới
                                    </NavLink>
                                </div>
                            )}
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
