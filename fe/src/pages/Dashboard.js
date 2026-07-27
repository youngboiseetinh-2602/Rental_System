import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const recommendedRooms = [
    {
        title: 'Phòng gác xinh sát ĐH Bách Khoa',
        location: 'Tạ Quang Bửu, Hai Bà Trưng, Hà Nội',
        area: '25 m²',
        price: '2.600.000 đ/tháng',
        tag: 'Đã liên hệ',
    },
    {
        title: 'Phòng studio thông thoáng',
        location: 'Hai Bà Trưng, Hà Nội',
        area: '28 m²',
        price: '2.300.000 đ/tháng',
        tag: 'Đang xem xét',
    },
    {
        title: 'Phòng duplex full nội thất',
        location: 'Khương Đình, Thanh Xuân, Hà Nội',
        area: '30 m²',
        price: '2.800.000 đ/tháng',
        tag: 'Mới',
    },
];

const favoriteRooms = [
    {
        title: 'Phòng cực xinh ĐH Bách Khoa',
        price: '2.600.000 đ/tháng',
    },
    {
        title: 'Phòng studio thoáng mát',
        price: '2.300.000 đ/tháng',
    },
    {
        title: 'Phòng duplex full nội thất',
        price: '2.800.000 đ/tháng',
    },
];

const requests = [
    {
        room: 'Phòng gác xinh ĐH Bách Khoa',
        area: '25 m²',
        date: '20/05/2024',
        status: 'Chờ phản hồi',
    },
    {
        room: 'Phòng studio thông thoáng',
        area: '28 m²',
        date: '19/05/2024',
        status: 'Đang xem xét',
    },
    {
        room: 'Phòng duplex full nội thất',
        area: '30 m²',
        date: '18/05/2024',
        status: 'Đã liên hệ',
    },
];

function Dashboard() {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const username = user?.name || user?.username || 'Khách hàng';

    return (
        <div className="dashboard-page">
            <section className="dashboard-hero">
                <div className="dashboard-hero-copy">
                    <p className="dashboard-eyebrow">Chào mừng trở lại,</p>
                    <h1>{username}!</h1>
                    <p className="dashboard-description">
                        Tìm phòng phù hợp nhanh chóng và dễ dàng.
                        RentalRoom luôn sẵn sàng hỗ trợ bạn.
                    </p>

                    <div className="dashboard-search">
                        <div className="dashboard-search-grid">
                            <label>
                                Khu vực
                                <input type="text" placeholder="Nhập khu vực, tên đường..." />
                            </label>
                            <label>
                                Loại phòng
                                <select>
                                    <option>Phòng đơn</option>
                                    <option>Phòng đôi</option>
                                    <option>Studio</option>
                                </select>
                            </label>
                            <label>
                                Khoảng giá
                                <select>
                                    <option>1 triệu - 2 triệu</option>
                                    <option>2 triệu - 3 triệu</option>
                                    <option>3 triệu - 4 triệu</option>
                                </select>
                            </label>
                            <label>
                                Diện tích
                                <select>
                                    <option>Dưới 20 m²</option>
                                    <option>20 - 30 m²</option>
                                    <option>Trên 30 m²</option>
                                </select>
                            </label>
                        </div>
                        <button type="button">Tìm kiếm</button>
                    </div>

                    <div className="dashboard-popular-tags">
                        <span>Phổ biến:</span>
                        <button type="button">Cầu Giấy</button>
                        <button type="button">Thanh Xuân</button>
                        <button type="button">Gần ĐH Bách Khoa</button>
                        <button type="button">Gần ĐH Kinh tế</button>
                    </div>
                </div>

                <div className="dashboard-hero-visual" aria-hidden="true" />
            </section>

            <div className="dashboard-grid">
                <section className="dashboard-summary-card">
                    <div className="dashboard-summary-header">
                        <h2>Gợi ý cho bạn</h2>
                        <button type="button">Xem tất cả</button>
                    </div>
                    <div className="dashboard-card-list">
                        {recommendedRooms.map((room) => (
                            <article className="mini-room-card" key={room.title}>
                                <div className="mini-room-image" />
                                <div>
                                    <h3>{room.title}</h3>
                                    <p>{room.location}</p>
                                    <div className="mini-room-meta">
                                        <span>{room.area}</span>
                                        <strong>{room.price}</strong>
                                    </div>
                                </div>
                                <span className="room-tag">{room.tag}</span>
                            </article>
                        ))}
                    </div>
                </section>

                <aside className="dashboard-favorite-card">
                    <div className="dashboard-summary-header">
                        <h2>Yêu thích của bạn</h2>
                        <button type="button">Xem tất cả</button>
                    </div>
                    <ul className="favorite-list">
                        {favoriteRooms.map((room) => (
                            <li key={room.title}>
                                <div>
                                    <strong>{room.title}</strong>
                                    <span>{room.price}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>

            <div className="dashboard-grid dashboard-grid-two">
                <section className="dashboard-requests-card">
                    <div className="dashboard-summary-header">
                        <h2>Yêu cầu thuê trọ của bạn</h2>
                        <span>3</span>
                    </div>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Phòng trọ</th>
                                <th>Khu vực</th>
                                <th>Ngày gửi</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.room}>
                                    <td>{request.room}</td>
                                    <td>{request.area}</td>
                                    <td>{request.date}</td>
                                    <td>
                                        <span className={`status-pill status-${request.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="dashboard-chat-card">
                    <div className="dashboard-summary-header">
                        <h2>Tin nhắn gần đây</h2>
                        <button type="button">Xem tất cả</button>
                    </div>
                    <div className="chat-list">
                        <article>
                            <strong>Chủ trọ Trần Văn C</strong>
                            <p>Phòng vẫn còn trống bạn nhé!</p>
                            <time>10:30</time>
                        </article>
                        <article>
                            <strong>Chủ trọ Trần Văn C</strong>
                            <p>Bạn muốn xem phòng khi nào ạ?</p>
                            <time>Hôm qua</time>
                        </article>
                        <article>
                            <strong>Chủ trọ Lê Minh D</strong>
                            <p>Cảm ơn bạn đã quan tâm phòng nhé.</p>
                            <time>21/05</time>
                        </article>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
