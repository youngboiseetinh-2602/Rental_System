import React from 'react';

const highlights = [
    {
        title: 'Uy tín hàng đầu',
        description: 'Mỗi phòng trọ đều được kiểm duyệt trước khi hiển thị, giúp bạn thuê nhà an tâm hơn.',
        icon: '✓',
    },
    {
        title: 'Tìm nhanh, chọn chuẩn',
        description: 'Bộ lọc địa điểm, loại trọ và giá cả giúp bạn tìm ra phòng phù hợp trong nháy mắt.',
        icon: '⚡',
    },
    {
        title: 'Hỗ trợ tận tình',
        description: 'Đội ngũ hỗ trợ luôn sẵn sàng giải đáp và giúp bạn đặt phòng nhanh chóng.',
        icon: '💬',
    },
];

const team = [
    {
        name: 'Minh Hoàng',
        role: 'Người sáng lập',
        quote: 'Mang đến dịch vụ thuê trọ dễ dàng hơn cho mọi người.',
    },
    {
        name: 'Lan Phương',
        role: 'Trưởng dự án',
        quote: 'Xây dựng nền tảng thân thiện và chuyên nghiệp cho người thuê.',
    },
    {
        name: 'Tuấn Anh',
        role: 'Phát triển sản phẩm',
        quote: 'Tối ưu trải nghiệm tìm phòng và giao diện trực quan.',
    },
];

function AboutUs() {
    return (
        <div className="container" style={{ maxWidth: '1100px', marginTop: '56px', marginBottom: '80px' }}>
            <section className="row align-items-center gy-4" style={{ marginBottom: '56px' }}>
                <div className="col-md-6">
                    <p className="text-success fw-bold mb-3">VỀ CHÚNG TÔI</p>
                    <h1 style={{ fontSize: '3rem', lineHeight: 1.05, fontWeight: 800 }}>
                        RentalRoom - Nơi kết nối người thuê với phòng trọ chất lượng
                    </h1>
                    <p className="text-muted mt-4" style={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
                        Chúng tôi giúp bạn tìm phòng trọ phù hợp nhanh chóng, minh bạch và an tâm. Mỗi căn phòng trên RentalRoom đều được chọn lọc để mang lại không gian sống tiện nghi và an toàn.
                    </p>
                    <div className="d-flex flex-wrap gap-3 mt-4">
                        <div className="p-3 bg-light rounded-4" style={{ minWidth: '170px' }}>
                            <h2 className="mb-1" style={{ fontSize: '2rem' }}>125+</h2>
                            <p className="mb-0 text-muted">Phòng trọ chất lượng</p>
                        </div>
                        <div className="p-3 bg-light rounded-4" style={{ minWidth: '170px' }}>
                            <h2 className="mb-1" style={{ fontSize: '2rem' }}>24/7</h2>
                            <p className="mb-0 text-muted">Hỗ trợ khách hàng</p>
                        </div>
                        <div className="p-3 bg-light rounded-4" style={{ minWidth: '170px' }}>
                            <h2 className="mb-1" style={{ fontSize: '2rem' }}>100%</h2>
                            <p className="mb-0 text-muted">Thông tin minh bạch</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="p-4 rounded-4" style={{ background: 'linear-gradient(145deg, #e8f6ef, #ffffff)' }}>
                        <h3 className="mb-4" style={{ fontWeight: 700 }}>Tại sao chọn RentalRoom?</h3>
                        <div className="row g-3">
                            {highlights.map((item) => (
                                <div className="col-12" key={item.title}>
                                    <div className="d-flex align-items-start gap-3 p-3 rounded-4" style={{ background: '#fff', boxShadow: '0 12px 30px rgba(17, 93, 61, 0.06)' }}>
                                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-success text-white" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h5 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{item.title}</h5>
                                            <p className="mb-0 text-muted">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="text-center" style={{ marginBottom: '56px' }}>
                <p className="text-uppercase text-success fw-bold mb-3">Sứ mệnh của chúng tôi</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Giúp mỗi chuyến đi tìm nhà trở nên đơn giản và tin cậy hơn</h2>
                <p className="text-muted mx-auto" style={{ maxWidth: '720px', marginTop: '20px', lineHeight: 1.8 }}>
                    RentalRoom xây dựng nền tảng để người thuê dễ dàng tìm phòng, chủ nhà dễ dàng quản lý, và mọi giao dịch đều minh bạch. Chúng tôi không chỉ là nơi đăng tin, mà là nơi tạo ra trải nghiệm thuê nhà tin cậy cho cộng đồng.
                </p>
            </section>

            <section>
                <div className="row gy-4">
                    {team.map((member) => (
                        <div className="col-md-4" key={member.name}>
                            <div className="card h-100 shadow-sm rounded-4" style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
                                <div className="card-body d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center mb-4" style={{ width: '64px', height: '64px', fontSize: '1.4rem' }}>
                                            {member.name.charAt(0)}
                                        </div>
                                        <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{member.name}</h4>
                                        <p className="text-muted mb-3">{member.role}</p>
                                        <p className="text-muted" style={{ lineHeight: 1.8 }}>{member.quote}</p>
                                    </div>
                                    <div className="mt-4">
                                        <span className="badge bg-success bg-opacity-15 text-success rounded-pill py-2 px-3">
                                            Đam mê phục vụ
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="text-center mt-5 py-5 rounded-4" style={{ background: 'linear-gradient(135deg, rgba(20,122,67,0.1), rgba(255,255,255,1))' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Sẵn sàng tìm phòng trọ lý tưởng?</h2>
                <p className="text-muted mx-auto" style={{ maxWidth: '720px', marginTop: '18px', lineHeight: 1.8 }}>
                    Hãy bắt đầu hành trình của bạn với RentalRoom ngay hôm nay. Chúng tôi sẽ giúp bạn tìm được nơi ở phù hợp nhất trong thời gian ngắn.
                </p>
            </section>
        </div>
    );
}

export default AboutUs;
