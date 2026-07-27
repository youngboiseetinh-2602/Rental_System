import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    mapRentalProperty,
    normalizeRentalSearchParams,
    searchRentalProperties,
} from '../services/rentalService';

const roomTypes = [
    { value: '', label: 'Chọn loại trọ' },
    { value: 'studio', label: 'Studio' },
    { value: 'phòng đơn', label: 'Phòng đơn' },
    { value: 'phòng đôi', label: 'Phòng đôi' },
];

const EMPTY_FILTERS = Object.freeze({
    searchText: '',
    city: '',
    ward: '',
    street: '',
    roomType: '',
    minPrice: '',
    maxPrice: '',
});

function PhongTro() {
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
    const [rentals, setRentals] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const initialRequestStarted = useRef(false);
    const latestRequestId = useRef(0);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const fetchRentals = useCallback(async (searchParams = {}) => {
        const requestId = latestRequestId.current + 1;
        latestRequestId.current = requestId;
        setLoading(true);
        setError('');

        try {
            const response = await searchRentalProperties(searchParams);
            if (requestId !== latestRequestId.current) {
                return;
            }

            const content = Array.isArray(response.content)
                ? response.content
                : [];
            setRentals(content.map(mapRentalProperty));
            setTotal(Number(response.totalElements ?? content.length));
        } catch (requestError) {
            if (requestId !== latestRequestId.current) {
                return;
            }

            setRentals([]);
            setTotal(0);
            setError(
                requestError.message
                || 'Không thể tải danh sách phòng trọ.',
            );
        } finally {
            if (requestId === latestRequestId.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (initialRequestStarted.current) {
            return;
        }

        initialRequestStarted.current = true;
        fetchRentals({});
    }, [fetchRentals]);

    const filterMap = () => normalizeRentalSearchParams({
        description: filters.searchText,
        city: filters.city,
        ward: filters.ward,
        street: filters.street,
        rentalType: filters.roomType,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
    });

    const applyFilters = () => {
        const params = filterMap();
        const minPrice = Number(params.minPrice);
        const maxPrice = Number(params.maxPrice);

        if (
            params.minPrice !== undefined
            && params.maxPrice !== undefined
            && minPrice > maxPrice
        ) {
            setError('Giá tối thiểu không được lớn hơn giá tối đa.');
            return;
        }

        fetchRentals(params);
    };

    const clearFilters = () => {
        setFilters({ ...EMPTY_FILTERS });
        fetchRentals({});
    };

    return (
        <div className="page-container rental-search-page" style={{ width: '100%', maxWidth: '1900px', padding: '0 30px', margin: '36px auto 60px' }}>
            <div className="mb-4">
                <div className="card shadow-sm" style={{ borderRadius: '22px' }}>
                    <div className="card-body py-3 px-4">
                        <div className="input-group" style={{ minHeight: '54px' }}>
                            <input
                                type="search"
                                className="form-control rental-search-input"
                                name="searchText"
                                value={filters.searchText}
                                onChange={handleChange}
                                placeholder="Tìm khu vực, quận, phường, đường..."
                            />
                            <button
                                type="button"
                                className="btn btn-success px-4"
                                onClick={applyFilters}
                                disabled={loading}
                            >
                                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row g-4">
                <div className="col-lg-4 col-xl-3">
                    <div className="card shadow-sm" style={{ borderRadius: '22px' }}>
                        <div className="card-body">
                            <h2 className="card-title rental-filter-title">
                                Bộ lọc tìm kiếm
                            </h2>

                            <div className="mb-3">
                                <label className="form-label">Thành phố</label>
                                <select
                                    className="form-select"
                                    name="city"
                                    value={filters.city}
                                    onChange={handleChange}
                                >
                                    <option value="">Chọn thành phố</option>
                                    <option value="Hà Nội">Hà Nội</option>
                                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                                    <option value="Đà Nẵng">Đà Nẵng</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Phường</label>
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
                                <label className="form-label">Đường</label>
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
                                <label className="form-label">Loại trọ</label>
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
                                <label className="form-label">Khoảng giá</label>
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

                            <div className="d-grid gap-2">
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={applyFilters}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang áp dụng...' : 'Áp dụng'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={clearFilters}
                                    disabled={loading}
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-8 col-xl-9">
                    <div className="d-flex flex-column gap-3">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3">
                            <div>
                                <h1 className="rental-results-title">
                                    Tìm thấy {loading ? '...' : total} phòng trọ
                                </h1>
                                <p className="rental-results-subtitle text-muted mb-0">
                                    Danh sách phòng trọ phù hợp tìm kiếm
                                </p>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <label className="rental-sort-label mb-0 text-muted">Sắp xếp:</label>
                                <select className="form-select rental-sort-select">
                                    <option value="newest">Mới nhất</option>
                                    <option value="priceAsc">Giá tăng dần</option>
                                    <option value="priceDesc">Giá giảm dần</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        {!loading && !error && rentals.length === 0 && (
                            <div className="alert alert-light" role="status">
                                Không tìm thấy phòng trọ phù hợp.
                            </div>
                        )}

                        {rentals.map((rental) => (
                            <div
                                key={rental.id ?? rental.title}
                                className="card rental-result-card shadow-sm"
                                style={{ borderRadius: '22px' }}
                            >
                                <div className="card-body">
                                    <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                                        <div>
                                            <h2 className="rental-result-title">
                                                {rental.title}
                                            </h2>
                                            <p className="text-muted mb-2">{rental.location}</p>
                                            {rental.description && (
                                                <p className="mb-2">{rental.description}</p>
                                            )}
                                            <div className="d-flex flex-wrap gap-2">
                                                {rental.badges.map((badge) => (
                                                    <span key={badge} className="rental-result-badge badge bg-light text-dark py-2">
                                                        {badge}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rental-owner-info text-md-end">
                                            {rental.ownerName && (
                                                <p className="mb-1">
                                                    Chủ trọ: {rental.ownerName}
                                                </p>
                                            )}
                                            {rental.ownerPhoneNumber && (
                                                <p className="text-success fw-bold mb-2">
                                                    {rental.ownerPhoneNumber}
                                                </p>
                                            )}
                                            <button type="button" className="btn btn-outline-success">
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
