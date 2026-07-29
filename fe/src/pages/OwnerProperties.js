import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import AccountMenuIcon from '../components/AccountMenuIcon';
import ChatNavLink from '../components/ChatNavLink';
import NotificationNavLink from '../components/NotificationNavLink';
import useAuth from '../hooks/useAuth';
import { deleteOwnerProperty, getOwnerProperties } from '../services/ownerService';
import { getMyProfile } from '../services/userService';

function OwnerProperties() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [properties, setProperties] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [profileData, propertyData] = await Promise.all([
                getMyProfile(),
                getOwnerProperties(),
            ]);
            setProfile(profileData);
            setProperties(Array.isArray(propertyData) ? propertyData : []);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const displayName = profile?.fullName || user?.username || 'Chủ trọ';
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((word) => word[0]).join('').toUpperCase();
    const filteredProperties = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase('vi');
        if (!keyword) return properties;
        return properties.filter((property) => [
            property.name,
            property.detailedAddress,
            property.city,
            property.ward,
            property.street,
            property.rentalTypeName,
        ].some((value) => String(value || '').toLocaleLowerCase('vi').includes(keyword)));
    }, [properties, search]);

    const removeProperty = async (property) => {
        if (!window.confirm(`Bạn có chắc muốn xóa “${property.name}”?`)) return;
        setDeletingId(property.id);
        setError('');
        setMessage('');
        try {
            await deleteOwnerProperty(property.id);
            setProperties((current) => current.filter((item) => item.id !== property.id));
            setMessage('Đã xóa nhà trọ thành công.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="owner-dashboard owner-properties-page">
            <aside className="owner-sidebar">
                <NavLink className="owner-profile" to="/profile">
                    <span className="owner-avatar">
                        {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials}
                    </span>
                    <span><strong>{displayName}</strong><small>Chủ trọ</small></span>
                </NavLink>
                <nav>
                    <NavLink to="/owner/dashboard"><AccountMenuIcon name="home" />Tổng quan</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" />Thông tin cá nhân</NavLink>
                    <NavLink to="/owner/properties" end><AccountMenuIcon name="properties" />Danh sách phòng trọ</NavLink>
                    <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" />Tạo phòng trọ</NavLink>
                    <OwnerRentalRequestNavLink icon={<AccountMenuIcon name="requests" />} />
                    <NavLink to="/owner/contracts"><AccountMenuIcon name="contract" />Hợp đồng thuê</NavLink>
                    <ChatNavLink />
                    <NotificationNavLink />
                </nav>
            </aside>

            <main className="owner-main">
                <div className="owner-properties-heading">
                    <div>
                        <p>QUẢN LÝ NHÀ TRỌ</p>
                        <h1>Danh sách nhà trọ</h1>
                        <span>Quản lý thông tin và tình trạng các nhà trọ của bạn</span>
                    </div>
                    <NavLink className="owner-create-button" to="/owner/properties/new">＋ Tạo nhà trọ mới</NavLink>
                </div>

                {(error || message) && (
                    <div className={`profile-alert ${error ? 'is-error' : 'is-success'}`}>
                        {error || message}
                    </div>
                )}

                <section className="property-summary-grid">
                    <article><span>Tổng nhà trọ</span><strong>{properties.length}</strong></article>
                    <article><span>Đang hiển thị</span><strong>{properties.length}</strong></article>
                    <article><span>Đang tạm ẩn</span><strong>0</strong></article>
                </section>

                <section className="owner-property-card">
                    <div className="owner-property-toolbar">
                        <label>
                            <span aria-hidden="true">⌕</span>
                            <input value={search} onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm theo tên, địa chỉ, loại hình..." />
                        </label>
                        <span>Hiển thị <strong>{filteredProperties.length}</strong> kết quả</span>
                    </div>

                    {loading ? (
                        <div className="property-empty-state">Đang tải danh sách nhà trọ...</div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="property-empty-state">
                            <span className="property-empty-icon">⌂</span>
                            <h2>{search ? 'Không tìm thấy nhà trọ phù hợp' : 'Bạn chưa có nhà trọ nào'}</h2>
                            <p>{search ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Tạo nhà trọ đầu tiên để bắt đầu quản lý.'}</p>
                            {!search && <NavLink to="/owner/properties/new">Tạo nhà trọ mới</NavLink>}
                        </div>
                    ) : (
                        <div className="owner-property-table-wrap">
                            <table className="owner-property-table">
                                <thead><tr>
                                    <th>Nhà trọ</th><th>Loại hình</th><th>Địa chỉ</th>
                                    <th>Trạng thái</th><th>Thao tác</th>
                                </tr></thead>
                                <tbody>
                                    {filteredProperties.map((property) => {
                                        const address = property.detailedAddress || [
                                            property.houseNumber, property.street,
                                            property.ward, property.city,
                                        ].filter(Boolean).join(', ');
                                        return (
                                            <tr key={property.id}>
                                                <td>
                                                    <div className="property-name-cell">
                                                        <span>⌂</span>
                                                        <div><strong>{property.name || 'Nhà trọ chưa đặt tên'}</strong>
                                                            <small>Mã: #{property.id}</small></div>
                                                    </div>
                                                </td>
                                                <td><span className="property-type">{property.rentalTypeName || 'Chưa cập nhật'}</span></td>
                                                <td className="property-address">{address || 'Chưa cập nhật địa chỉ'}</td>
                                                <td><span className="property-active-status">● Đang hiển thị</span></td>
                                                <td>
                                                    <div className="property-actions">
                                                        <NavLink to={`/owner/properties/${property.id}`} title="Xem chi tiết">◉</NavLink>
                                                        <NavLink to={`/owner/properties/${property.id}/edit`}
                                                            title="Chỉnh sửa">✎</NavLink>
                                                        <button type="button" className="danger" disabled={deletingId === property.id}
                                                            onClick={() => removeProperty(property)} title="Xóa">
                                                            {deletingId === property.id ? '…' : '⌫'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default OwnerProperties;
