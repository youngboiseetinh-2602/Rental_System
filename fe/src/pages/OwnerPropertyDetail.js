import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import AccountMenuIcon from '../components/AccountMenuIcon';
import useAuth from '../hooks/useAuth';
import { getOwnerPropertyDetail } from '../services/ownerService';
import { getMyProfile } from '../services/userService';

const currency = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

function OwnerPropertyDetail() {
    const { propertyId } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [property, setProperty] = useState(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([getMyProfile(), getOwnerPropertyDetail(propertyId)])
            .then(([profileData, propertyData]) => {
                if (!active) return;
                setProfile(profileData);
                setProperty(propertyData);
                setSelectedImage(propertyData?.images?.[0]?.imageUrl || '');
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [propertyId]);

    const displayName = profile?.fullName || user?.username || 'Chủ trọ';
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((word) => word[0]).join('').toUpperCase();
    const address = useMemo(() => property?.detailedAddress || [
        property?.houseNumber, property?.street, property?.ward, property?.city,
    ].filter(Boolean).join(', '), [property]);

    return (
        <div className="owner-dashboard owner-property-detail-page">
            <aside className="owner-sidebar">
                <NavLink className="owner-brand" to="/owner/dashboard">⌂ <span>RentalRoom</span></NavLink>
                <NavLink className="owner-profile" to="/profile">
                    <span className="owner-avatar">{profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" /> : initials}</span>
                    <span><strong>{displayName}</strong><small>Chủ trọ</small></span>
                </NavLink>
                <nav>
                    <NavLink to="/owner/dashboard"><AccountMenuIcon name="home" />Tổng quan</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" />Thông tin cá nhân</NavLink>
                    <NavLink to="/owner/properties" className="active"><AccountMenuIcon name="properties" />Danh sách phòng trọ</NavLink>
                    <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" />Tạo phòng trọ</NavLink>
                    <OwnerRentalRequestNavLink icon={<AccountMenuIcon name="requests" />} />
                    <a href="#contracts"><AccountMenuIcon name="contract" />Hợp đồng thuê</a>
                    <NavLink to="/chats"><AccountMenuIcon name="chat" />Trò chuyện</NavLink>
                    <NavLink to="/notifications"><AccountMenuIcon name="notifications" />Thông báo</NavLink>
                </nav>
            </aside>

            <main className="owner-main">
                <div className="owner-detail-heading">
                    <div><p>QUẢN LÝ NHÀ TRỌ</p><h1>Chi tiết nhà trọ</h1></div>
                    <div><NavLink to="/owner/properties">← Danh sách</NavLink>
                        <NavLink to={`/owner/properties/${propertyId}/edit`}>✎ Chỉnh sửa</NavLink></div>
                </div>
                {error && <div className="profile-alert is-error">{error}</div>}
                {loading ? <div className="property-empty-state">Đang tải chi tiết nhà trọ...</div>
                    : property && (
                        <>
                            <section className="owner-detail-overview">
                                <div className="owner-detail-gallery">
                                    {selectedImage ? <img className="owner-detail-main-image"
                                        src={selectedImage} alt={property.name} />
                                        : <div className="owner-detail-no-image">⌂<span>Chưa có hình ảnh</span></div>}
                                    {property.images?.length > 0 && (
                                        <>
                                            <div className="owner-gallery-count">
                                                Tất cả hình ảnh <strong>{property.images.length}</strong>
                                            </div>
                                            <div className="owner-detail-thumbnails">
                                                {property.images.map((image, index) => <button type="button" key={image.id}
                                                    className={selectedImage === image.imageUrl ? 'active' : ''}
                                                    onClick={() => setSelectedImage(image.imageUrl)}>
                                                    <img src={image.imageUrl} alt={`Ảnh nhà trọ ${index + 1}`} />
                                                    <span>{index + 1}</span>
                                                </button>)}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <article className="owner-detail-info">
                                    <div className="owner-detail-badges">
                                        <span>{property.rentalTypeName || 'Nhà trọ'}</span>
                                        <b>● Đang hiển thị</b>
                                    </div>
                                    <h2>{property.name}</h2>
                                    <p className="owner-detail-address">⌖ {address || 'Chưa cập nhật địa chỉ'}</p>
                                    <p>{property.description || 'Chưa có mô tả cho nhà trọ này.'}</p>
                                    <dl>
                                        <div><dt>Chủ trọ</dt><dd>{property.ownerName || displayName}</dd></div>
                                        <div><dt>Số điện thoại</dt><dd>{property.ownerPhoneNumber || 'Chưa cập nhật'}</dd></div>
                                        <div><dt>Số loại phòng</dt><dd>{property.roomTypes?.length || 0}</dd></div>
                                        <div><dt>Tổng số phòng</dt><dd>{property.roomTypes?.reduce(
                                            (sum, type) => sum + (type.rooms?.length || 0), 0) || 0}</dd></div>
                                    </dl>
                                </article>
                            </section>

                            <section className="owner-detail-section">
                                <div className="owner-panel-title"><h2>Danh sách loại phòng</h2>
                                    <span>{property.roomTypes?.length || 0} loại phòng</span></div>
                                <div className="owner-room-type-detail-list">
                                    {property.roomTypes?.map((type) => (
                                        <article key={type.id}>
                                            <div className="owner-room-type-summary">
                                                <div><h3>{type.name}</h3><span>{type.area ? `${type.area} m²` : 'Chưa cập nhật diện tích'}</span></div>
                                                <strong>{currency.format(type.monthlyPrice || 0)}<small>/tháng</small></strong>
                                            </div>
                                            <div className="owner-room-type-meta">
                                                <span>♙ Tối đa {type.maxGuests || 0} người</span>
                                                <span>⌂ {type.rooms?.length || 0} phòng</span>
                                                <span>▣ {type.facilities?.length || 0} tiện ích</span>
                                            </div>
                                            <div className="owner-detail-facilities">
                                                {type.facilities?.map((facility) => <span key={facility.id}>
                                                    {facility.facilityName} × {facility.quantity}</span>)}
                                            </div>
                                            <div className="owner-detail-room-list">
                                                {type.rooms?.map((room) => <span key={room.id}>
                                                    <b>{room.name}</b><i className={String(room.status).toLowerCase()}>
                                                        {room.status || 'AVAILABLE'}</i></span>)}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="owner-detail-section">
                                <div className="owner-panel-title"><h2>Nội quy nhà trọ</h2></div>
                                <p className="owner-house-rules">{property.houseRules || 'Chưa cập nhật nội quy nhà trọ.'}</p>
                            </section>
                        </>
                    )}
            </main>
        </div>
    );
}

export default OwnerPropertyDetail;
