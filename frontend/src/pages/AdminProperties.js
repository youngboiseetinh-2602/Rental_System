import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { searchRentalProperties } from '../services/rentalService';

function AdminProperties() {
    const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [query, setQuery] = useState('');
    const [appliedQuery, setAppliedQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        searchRentalProperties({
            description: appliedQuery,
            page,
            size: 10,
        }).then(setResult)
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    }, [appliedQuery, page]);

    const search = (event) => {
        event.preventDefault();
        setPage(0);
        setAppliedQuery(query.trim());
    };

    return (
        <AdminLayout title="Danh sách phòng trọ" description="Theo dõi toàn bộ nhà trọ đang được đăng trên hệ thống.">
            <section className="admin-card admin-filter-card">
                <form className="admin-property-search" onSubmit={search}>
                    <label><span>Tìm phòng trọ</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nhập tên hoặc mô tả phòng trọ" /></label>
                    <button className="admin-primary" type="submit">Tìm kiếm</button>
                </form>
            </section>
            {error && <div className="admin-alert error">{error}</div>}
            <section className="admin-card admin-list-card">
                <div className="admin-card-heading"><div><span>DANH SÁCH PHÒNG TRỌ</span><h2>{result.totalElements || 0} địa điểm</h2></div></div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Phòng trọ</th><th>Chủ trọ</th><th>Loại hình</th><th>Địa chỉ</th><th>Chi tiết</th></tr></thead>
                        <tbody>
                            {result.content?.map((property) => (
                                <tr key={property.id}>
                                    <td><strong>{property.name || `Phòng trọ #${property.id}`}</strong></td>
                                    <td>{property.ownerName || '—'}<br /><small>{property.ownerPhoneNumber || ''}</small></td>
                                    <td>{property.rentalTypeName || '—'}</td>
                                    <td>{property.detailedAddress || [property.houseNumber, property.street, property.ward, property.city].filter(Boolean).join(', ') || '—'}</td>
                                    <td><NavLink className="admin-table-link" to={`/phong-tro/${property.id}`}>Xem →</NavLink></td>
                                </tr>
                            ))}
                            {loading && <tr><td colSpan="5" className="admin-empty">Đang tải dữ liệu...</td></tr>}
                            {!loading && !result.content?.length && <tr><td colSpan="5" className="admin-empty">Không tìm thấy phòng trọ.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination"><span>Trang {result.totalPages ? page + 1 : 0} / {result.totalPages || 0}</span><div><button disabled={!page} onClick={() => setPage(page - 1)}>← Trước</button><button disabled={page + 1 >= result.totalPages} onClick={() => setPage(page + 1)}>Sau →</button></div></div>
            </section>
        </AdminLayout>
    );
}

export default AdminProperties;
