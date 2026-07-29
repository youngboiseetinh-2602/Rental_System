import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getMyProfile } from '../services/userService';
import { getMyRentalRequests } from '../services/rentalService';
import AccountMenuIcon from '../components/AccountMenuIcon';

function formatRentalDate(value) {
    if (!value) return 'Chưa cập nhật';
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString('vi-VN');
}

function Dashboard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [rentalRequests, setRentalRequests] = useState([]);
    const [loadingRental, setLoadingRental] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([getMyProfile(), getMyRentalRequests()])
            .then(([profileData, requestData]) => {
                if (!active) return;
                setProfile(profileData);
                setRentalRequests(Array.isArray(requestData) ? requestData : []);
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoadingRental(false));
        return () => { active = false; };
    }, []);

    const username = profile?.fullName || user?.name || user?.username || 'Khách hàng';
    const initials = username.trim().split(/\s+/).slice(-2)
        .map((part) => part[0]).join('').toUpperCase();
    const today = new Date().toISOString().slice(0, 10);
    const currentRental = rentalRequests.find((request) => (
        request.status === 'APPROVED'
        && (!request.startDate || request.startDate <= today)
        && (!request.endDate || request.endDate >= today)
    ));

    return (
        <div className="profile-shell customer-dashboard-shell">
            <aside className="profile-sidebar">
                <NavLink className="profile-sidebar-user" to="/profile"
                    aria-label="Xem thông tin cá nhân">
                    <div className="profile-avatar">
                        {profile?.avatarUrl
                            ? <img src={profile.avatarUrl} alt={`Ảnh đại diện của ${username}`} />
                            : <span>{initials}</span>}
                    </div>
                    <div>
                        <strong>{username}</strong>
                        <span>Khách hàng</span>
                    </div>
                </NavLink>

                <nav aria-label="Menu tài khoản">
                    <NavLink to="/dashboard" className="active"><AccountMenuIcon name="home" /> Trang chủ</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" /> Thông tin cá nhân</NavLink>
                    <NavLink to="/yeu-cau-thue-tro"><AccountMenuIcon name="requests" /> Yêu cầu thuê trọ</NavLink>
                    <NavLink to="/chats"><AccountMenuIcon name="chat" /> Trò chuyện</NavLink>
                    <NavLink to="/notifications"><AccountMenuIcon name="notifications" /> Thông báo</NavLink>
                </nav>
            </aside>

            <main className="dashboard-main">
                {error && <div className="profile-alert is-error" role="alert">{error}</div>}
                <section className="dashboard-hero">
                    <div className="dashboard-hero-copy">
                        <p className="dashboard-eyebrow">Chào mừng trở lại,</p>
                        <h1>{username}!</h1>
                        <p className="dashboard-description">
                            Tìm phòng phù hợp nhanh chóng và dễ dàng. RentalRoom luôn sẵn sàng hỗ trợ bạn.
                        </p>

                        <div className="dashboard-search">
                            <div className="dashboard-search-grid">
                                <input className="search-input" placeholder="Nhập khu vực, tên đường..." />
                                <select>
                                    <option>Loại phòng</option>
                                    <option>Phòng đơn</option>
                                </select>
                                <select>
                                    <option>Khoảng giá</option>
                                    <option>1 - 2 triệu</option>
                                </select>
                                <select>
                                    <option>Diện tích</option>
                                    <option>20 - 30 m²</option>
                                </select>
                            </div>
                            <button type="button" className="btn-search">Tìm kiếm</button>
                        </div>
                    </div>

                    <div className="dashboard-hero-visual" aria-hidden="true" />
                </section>

                <section className="current-rental-card">
                    <div className="current-rental-heading">
                        <div><span>NƠI TRỌ HIỆN TẠI</span><h2>Thông tin thuê phòng</h2></div>
                        {currentRental && <b>Đang thuê</b>}
                    </div>
                    {loadingRental
                        ? <div className="current-rental-empty">Đang tải thông tin nơi trọ...</div>
                        : currentRental
                            ? <div className="current-rental-content">
                                <div className="current-rental-room-icon">⌂</div>
                                <div>
                                    <small>Phòng đang thuê</small>
                                    <h3>{currentRental.roomName
                                        || `Phòng #${currentRental.roomId}`}</h3>
                                    <span>Hợp đồng #{currentRental.id}</span>
                                </div>
                                <dl>
                                    <div><dt>Thời gian bắt đầu</dt>
                                        <dd>{formatRentalDate(currentRental.startDate)}</dd></div>
                                    <div><dt>Thời gian kết thúc</dt>
                                        <dd>{formatRentalDate(currentRental.endDate)}</dd></div>
                                </dl>
                                <NavLink to={`/phong-tro/${currentRental.rentalPropertyId}`}>
                                    Xem chi tiết
                                </NavLink>
                            </div>
                            : <div className="current-rental-empty">
                                <span>⌂</span>
                                <h3>Bạn chưa có nơi trọ hiện tại</h3>
                                <p>Nơi trọ sẽ xuất hiện khi yêu cầu thuê được chủ trọ chấp nhận.</p>
                                <NavLink to="/phong-tro">Tìm phòng trọ</NavLink>
                            </div>}
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
