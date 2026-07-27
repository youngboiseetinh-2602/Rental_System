import React, { useMemo, useState } from 'react';

const roomTypes = [
    { value: '', label: 'Chọn loại trọ' },
    { value: 'studio', label: 'Studio' },
    { value: 'phong-don', label: 'Phòng đơn' },
    { value: 'phong-doi', label: 'Phòng đôi' },
];

const sampleRentals = [
    {
        title: 'Phòng trọ đầy đủ nội thất, cửa sổ thoáng mát',
        location: 'Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
        area: '25 m²',
        price: '3.200.000 đ/tháng',
        badges: ['Nội thất', 'WC riêng'],
    },
    {
        title: 'Phòng có gác lửng, giờ giấc tự do',
        location: 'Đường Nguyễn Trãi, Thanh Xuân, Hà Nội',
        area: '20 m²',
        price: '2.600.000 đ/tháng',
        badges: ['Có gác', 'Chỗ để xe'],
    },
    {
        title: 'Phòng trọ sinh viên giá rẻ',
        location: 'Đường Hồ Tùng Mậu, Nam Từ Liêm, Hà Nội',
        area: '18 m²',
        price: '2.000.000 đ/tháng',
        badges: ['WC riêng', 'Cửa sổ'],
    },
];

function PhongTro() {
    const [filters, setFilters] = useState({
        searchText: '',
        city: '',
        ward: '',
        street: '',
        roomType: '',
        minPrice: 0,
        maxPrice: 10000000,
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFilters((current) => ({
            ...current,
            [name]: name === 'minPrice' || name === 'maxPrice'
                ? Number(value)
                : value,
        }));
    };

    const filteredRentals = useMemo(() => sampleRentals, []);

    return (
        <div className="page-container" style={{ width: '100%', maxWidth: '1900px', padding: '0 30px', margin: '36px auto 60px' }}>
            <div className="mb-4">
                <div className="card shadow-sm" style={{ borderRadius: '22px' }}>
                    <div className="card-body py-3 px-4">
                        <div className="input-group" style={{ minHeight: '54px' }}>
                            <input
                                type="search"
                                className="form-control fs-5"
                                name="searchText"
                                value={filters.searchText}
                                onChange={handleChange}
                                placeholder="Tìm khu vực, quận, phường, đường..."
                            />
                            <button type="button" className="btn btn-success px-4">
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row g-4">
                <div className="col-lg-4 col-xl-3">
                    <div className="card shadow-sm" style={{ borderRadius: '22px' }}>
                        <div className="card-body">
                            <h2 className="card-title" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                Bộ lọc tìm kiếm
                            </h2>

                            <div className="mb-3">
                                <label className="form-label" style={{ fontSize: '1rem' }}>Thành phố</label>
                                <select
                                    className="form-select"
                                    name="city"
                                    value={filters.city}
                                    onChange={handleChange}
                                >
                                    <option value="">Chọn thành phố</option>
                                    <option value="hanoi">Hà Nội</option>
                                    <option value="hochiminh">Hồ Chí Minh</option>
                                    <option value="danang">Đà Nẵng</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label" style={{ fontSize: '1rem' }}>Phường</label>
                                <input
                                    className="form-control"
                                    type="text"
                                    name="ward"
                                    value={filters.ward}
                                    onChange={handleChange}
                                    placeholder="Nhập phường"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label" style={{ fontSize: '1rem' }}>Đường</label>
                                <input
                                    className="form-control"
                                    type="text"
                                    name="street"
                                    value={filters.street}
                                    onChange={handleChange}
                                    placeholder="Nhập đường"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label" style={{ fontSize: '1rem' }}>Loại trọ</label>
                                <select
                                    className="form-select"
                                    name="roomType"
                                    value={filters.roomType}
                                    onChange={handleChange}
                                >
                                    {roomTypes.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="form-label" style={{ fontSize: '1rem' }}>Khoảng giá</label>
                                <div className="row g-2 mt-2">
                                    <div className="col-6">
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="minPrice"
                                            value={filters.minPrice}
                                            onChange={handleChange}
                                            placeholder="Giá min"
                                            min={0}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="maxPrice"
                                            value={filters.maxPrice}
                                            onChange={handleChange}
                                            placeholder="Giá max"
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="button" className="btn btn-success w-100">
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-lg-8 col-xl-9">
                    <div className="d-flex flex-column gap-3">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3">
                            <div>
                                <h1 style={{ fontSize: '2.4rem', fontWeight: 700, margin: 0 }}>
                                    Tìm thấy 125 phòng trọ
                                </h1>
                                <p className="text-muted mb-0" style={{ fontSize: '1.05rem' }}>
                                    Danh sách phòng trọ phù hợp tìm kiếm
                                </p>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <label className="mb-0 text-muted">Sắp xếp:</label>
                                <select className="form-select" style={{ minWidth: '180px' }}>
                                    <option value="newest">Mới nhất</option>
                                    <option value="priceAsc">Giá tăng dần</option>
                                    <option value="priceDesc">Giá giảm dần</option>
                                </select>
                            </div>
                        </div>

                        {filteredRentals.map((rental) => (
                            <div
                                key={rental.title}
                                className="card shadow-sm"
                                style={{ borderRadius: '22px' }}
                            >
                                <div className="card-body">
                                    <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                                        <div>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                                {rental.title}
                                            </h2>
                                            <p className="text-muted mb-2">{rental.location}</p>
                                            <div className="d-flex flex-wrap gap-2 mb-2">
                                                <span className="badge bg-light text-dark py-2">
                                                    {rental.area}
                                                </span>
                                                {rental.badges.map((badge) => (
                                                    <span key={badge} className="badge bg-light text-dark py-2">
                                                        {badge}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="text-md-end">
                                            <p className="text-success fw-bold mb-2" style={{ fontSize: '1.45rem' }}>
                                                {rental.price}
                                            </p>
                                            <button type="button" className="btn btn-outline-success btn-sm">
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PhongTro;
