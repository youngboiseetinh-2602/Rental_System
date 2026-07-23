import React from 'react';
import heroImage from '../assets/rental-hero.png';

const benefits = [
    {
        icon: '⌂',
        title: 'Thông tin minh bạch',
        description: 'Chủ trọ xác thực',
    },
    {
        icon: '⌁',
        title: 'Bộ lọc thông minh',
        description: 'Tìm nhanh phòng phù hợp',
    },
    {
        icon: '◇',
        title: 'Hỗ trợ 24/7',
        description: 'Tư vấn nhiệt tình',
    },
];

const roomTypes = [
    {
        title: 'Phòng đầy đủ nội thất',
        price: '3.2 triệu/tháng',
        position: '62% center',
    },
    {
        title: 'Phòng có gác, cửa sổ',
        price: '2.6 triệu/tháng',
        position: '78% center',
    },
    {
        title: 'Phòng trọ sinh viên',
        price: '2.0 triệu/tháng',
        position: '92% center',
    },
];

function Home() {
    return (
        <div className="home-page">
            <section className="hero-section">
                <img
                    className="hero-background"
                    src={heroImage}
                    alt="Phòng trọ sáng, hiện đại và đầy đủ nội thất"
                />
                <div className="hero-overlay" />

                <div className="hero-copy col-12 col-lg-7">
                    <p className="hero-eyebrow">Tìm phòng trọ nhanh chóng</p>
                    <h1>
                        Tìm nơi ở phù hợp
                        <span>Dễ dàng &amp; nhanh chóng</span>
                    </h1>
                    <p className="hero-description">
                        Hàng ngàn phòng trọ chất lượng, giá tốt
                        <span>được xác minh thông tin rõ ràng.</span>
                    </p>

                    <div className="rental-introduction">
                        <p className="introduction-label">Không gian phù hợp, cuộc sống tốt hơn</p>
                        <p className="introduction-copy">
                            RentalRoom kết nối người thuê với những phòng trọ uy tín,
                            thông tin rõ ràng và mức giá phù hợp. Mỗi căn phòng đều
                            được chọn lọc để bạn an tâm bắt đầu cuộc sống mới.
                        </p>
                    </div>

                    <div className="benefit-list row g-3">
                        {benefits.map((benefit) => (
                            <article className="benefit-item col-12 col-sm-6 col-xl-4" key={benefit.title}>
                                <span className="benefit-icon" aria-hidden="true">
                                    {benefit.icon}
                                </span>
                                <div>
                                    <h2>{benefit.title}</h2>
                                    <p>{benefit.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="room-preview-list">
                    {roomTypes.map((room) => (
                        <article className="room-preview-card" key={room.title}>
                            <div
                                className="room-preview-image"
                                style={{ backgroundPosition: room.position }}
                                role="img"
                                aria-label={room.title}
                            />
                            <h2>{room.title}</h2>
                            <p>{room.price}</p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Home;
