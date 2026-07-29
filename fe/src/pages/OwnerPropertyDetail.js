import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import AccountMenuIcon from '../components/AccountMenuIcon';
import ChatNavLink from '../components/ChatNavLink';
import NotificationNavLink from '../components/NotificationNavLink';
import useAuth from '../hooks/useAuth';
import {
    getOwnerPropertyDetail,
    getOwnerPropertyTenants,
    sendOwnerNotification,
} from '../services/ownerService';
import { getMyProfile } from '../services/userService';

const currency = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

function formatDate(value) {
    if (!value) return 'Không thời hạn';
    const [year, month, day] = String(value).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
}

function OwnerPropertyDetail() {
    const { propertyId } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [property, setProperty] = useState(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showTenants, setShowTenants] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [tenantsLoading, setTenantsLoading] = useState(false);
    const [tenantsError, setTenantsError] = useState('');
    const [notificationRecipient, setNotificationRecipient] = useState(null);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationContent, setNotificationContent] = useState('');
    const [notificationSending, setNotificationSending] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationError, setNotificationError] = useState('');

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

    const openTenantList = async () => {
        setShowTenants(true);
        setTenantsLoading(true);
        setTenantsError('');
        setNotificationMessage('');
        setNotificationError('');
        setNotificationRecipient(null);
        try {
            const data = await getOwnerPropertyTenants(propertyId);
            setTenants(Array.isArray(data) ? data : []);
        } catch (requestError) {
            setTenantsError(requestError.message);
        } finally {
            setTenantsLoading(false);
        }
    };

    const openNotificationForm = (tenant) => {
        setNotificationRecipient(tenant);
        setNotificationTitle('');
        setNotificationContent('');
        setNotificationMessage('');
        setNotificationError('');
    };

    const submitNotification = async (event) => {
        event.preventDefault();
        if (!notificationRecipient || notificationSending) return;

        setNotificationSending(true);
        setNotificationError('');
        try {
            await sendOwnerNotification({
                receiverId: notificationRecipient.tenantId,
                title: notificationTitle.trim(),
                content: notificationContent.trim(),
            });
            setNotificationMessage(
                `Đã gửi thông báo đến ${notificationRecipient.tenantName || 'người thuê'}.`,
            );
            setNotificationRecipient(null);
            setNotificationTitle('');
            setNotificationContent('');
        } catch (requestError) {
            setNotificationError(requestError.message);
        } finally {
            setNotificationSending(false);
        }
    };

    return (
        <div className="owner-dashboard owner-property-detail-page">
            <aside className="owner-sidebar">
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
                    <NavLink to="/owner/contracts"><AccountMenuIcon name="contract" />Hợp đồng thuê</NavLink>
                    <ChatNavLink />
                    <NotificationNavLink />
                </nav>
            </aside>

            <main className="owner-main">
                <div className="owner-detail-heading">
                    <div><p>QUẢN LÝ NHÀ TRỌ</p><h1>Chi tiết nhà trọ</h1></div>
                    <div><NavLink to="/owner/properties">← Danh sách</NavLink>
                        <button type="button" className="owner-tenant-list-button"
                            onClick={openTenantList}>♙ Danh sách người thuê</button>
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
            {showTenants && (
                <div className="owner-tenant-modal-backdrop"
                    onMouseDown={() => setShowTenants(false)}>
                    <section className="owner-tenant-modal" role="dialog" aria-modal="true"
                        aria-labelledby="tenant-list-title"
                        onMouseDown={(event) => event.stopPropagation()}>
                        <header>
                            <div>
                                <span>QUẢN LÝ NGƯỜI THUÊ</span>
                                <h2 id="tenant-list-title">Danh sách người thuê</h2>
                                <p>{property?.name || 'Nhà trọ'}</p>
                            </div>
                            <div className="owner-tenant-modal-actions">
                                <NavLink to="/owner/contracts">
                                    Xem hợp đồng thuê
                                </NavLink>
                                <button type="button" aria-label="Đóng"
                                    onClick={() => setShowTenants(false)}>×</button>
                            </div>
                        </header>

                        {tenantsLoading ? (
                            <div className="owner-tenant-state">Đang tải danh sách người thuê...</div>
                        ) : tenantsError ? (
                            <div className="owner-tenant-state is-error">{tenantsError}</div>
                        ) : tenants.length === 0 ? (
                            <div className="owner-tenant-state">
                                Nhà trọ này chưa có người thuê.
                            </div>
                        ) : (
                            <>
                                {notificationMessage && (
                                    <div className="owner-tenant-notification-success">
                                        {notificationMessage}
                                    </div>
                                )}
                                <div className="owner-tenant-table-wrap">
                                    <table className="owner-tenant-table">
                                        <thead>
                                            <tr>
                                                <th>Phòng</th>
                                                <th>Tên người thuê</th>
                                                <th>Thời gian bắt đầu</th>
                                                <th>Thời gian kết thúc</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tenants.map((tenant) => (
                                                <tr key={tenant.id}>
                                                    <td><strong>{tenant.roomName || `Phòng #${tenant.roomId}`}</strong></td>
                                                    <td>{tenant.tenantName || `Người thuê #${tenant.tenantId}`}</td>
                                                    <td>{formatDate(tenant.startDate)}</td>
                                                    <td>{formatDate(tenant.endDate)}</td>
                                                    <td>
                                                        <button type="button"
                                                            className="owner-write-notification-button"
                                                            onClick={() => openNotificationForm(tenant)}>
                                                            Viết thông báo
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {notificationRecipient && (
                            <div className="owner-tenant-compose-layer">
                                <form className="owner-tenant-compose-form"
                                    onSubmit={submitNotification}>
                                    <header>
                                        <div>
                                            <span>GỬI ĐẾN NGƯỜI THUÊ</span>
                                            <h3>Viết thông báo</h3>
                                            <p>{notificationRecipient.tenantName
                                                || `Người thuê #${notificationRecipient.tenantId}`}
                                                {' · '}
                                                {notificationRecipient.roomName
                                                    || `Phòng #${notificationRecipient.roomId}`}
                                            </p>
                                        </div>
                                        <button type="button" aria-label="Đóng"
                                            onClick={() => setNotificationRecipient(null)}>×</button>
                                    </header>

                                    {notificationError && (
                                        <div className="owner-tenant-compose-error">
                                            {notificationError}
                                        </div>
                                    )}
                                    <label>
                                        Tiêu đề
                                        <input value={notificationTitle}
                                            onChange={(event) => setNotificationTitle(event.target.value)}
                                            maxLength={150} required autoFocus
                                            placeholder="Nhập tiêu đề thông báo" />
                                    </label>
                                    <label>
                                        Nội dung
                                        <textarea value={notificationContent}
                                            onChange={(event) => setNotificationContent(event.target.value)}
                                            maxLength={2000} rows={7} required
                                            placeholder="Nhập nội dung gửi đến người thuê" />
                                    </label>
                                    <footer>
                                        <button type="button"
                                            onClick={() => setNotificationRecipient(null)}>
                                            Hủy
                                        </button>
                                        <button type="submit"
                                            disabled={notificationSending
                                                || !notificationTitle.trim()
                                                || !notificationContent.trim()}>
                                            {notificationSending ? 'Đang gửi...' : 'Gửi thông báo'}
                                        </button>
                                    </footer>
                                </form>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default OwnerPropertyDetail;
