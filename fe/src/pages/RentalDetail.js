import React, { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { createRentalRequest, getRentalPropertyDetail } from '../services/rentalService';
import useAuth from '../hooks/useAuth';
import { userHasRole } from '../utils/authRouting';

const formatPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
});

function RentalDetail() {
    const { rentalPropertyId } = useParams();
    const { isAuthenticated, user } = useAuth();
    const [rental, setRental] = useState(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [requestForm, setRequestForm] = useState({ startDate: '', endDate: '' });
    const [requesting, setRequesting] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');

    useEffect(() => {
        let active = true;
        getRentalPropertyDetail(rentalPropertyId)
            .then((data) => {
                if (!active) return;
                setRental(data);
                setSelectedImage(data?.images?.[0]?.imageUrl || '');
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [rentalPropertyId]);

    const address = rental?.detailedAddress || [
        rental?.houseNumber, rental?.street, rental?.ward, rental?.city,
    ].filter(Boolean).join(', ');
    const today = new Date().toISOString().slice(0, 10);

    const chooseRoom = (room, roomType) => {
        if (String(room.status).toUpperCase() !== 'AVAILABLE') return;
        if (!isAuthenticated) {
            if (window.confirm('Bạn cần đăng nhập bằng tài khoản khách hàng để gửi yêu cầu thuê. Đi đến trang đăng nhập?')) {
                window.location.assign(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
            }
            return;
        }
        if (!userHasRole(user, 'CUSTOMER')) {
            window.alert('Chỉ tài khoản khách hàng mới có thể gửi yêu cầu thuê trọ.');
            return;
        }
        if (window.confirm(`Bạn có muốn gửi yêu cầu thuê phòng “${room.name}” thuộc loại “${roomType.name}” không?`)) {
            setSelectedRoom({ ...room, roomTypeName: roomType.name });
            setRequestForm({ startDate: '', endDate: '' });
            setRequestMessage('');
        }
    };

    const submitRentalRequest = async (event) => {
        event.preventDefault();
        if (!selectedRoom) return;
        if (requestForm.endDate <= requestForm.startDate) {
            setRequestMessage('Ngày kết thúc phải sau ngày bắt đầu.');
            return;
        }
        setRequesting(true);
        setRequestMessage('');
        try {
            await createRentalRequest({
                roomId: selectedRoom.id,
                startDate: requestForm.startDate,
                endDate: requestForm.endDate,
            });
            setRequestMessage('Gửi yêu cầu thuê thành công. Vui lòng chờ phản hồi từ chủ trọ.');
            window.setTimeout(() => {
                setSelectedRoom(null);
                setRequestMessage('');
            }, 1800);
        } catch (requestError) {
            setRequestMessage(requestError.message);
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return <div className="rental-detail-status">Đang tải chi tiết nhà trọ...</div>;
    }
    if (error || !rental) {
        return <div className="rental-detail-status is-error">{error || 'Không tìm thấy nhà trọ.'}
            <NavLink to="/phong-tro">Quay lại danh sách</NavLink></div>;
    }

    return (
        <main className="rental-public-detail">
            <div className="rental-detail-breadcrumb">
                <NavLink to="/phong-tro">Phòng trọ</NavLink><span>›</span><b>{rental.name}</b>
            </div>
            <section className="rental-public-hero">
                <div className="owner-detail-gallery">
                    {selectedImage ? <img className="owner-detail-main-image" src={selectedImage} alt={rental.name} />
                        : <div className="owner-detail-no-image">⌂<span>Chưa có hình ảnh</span></div>}
                    {rental.images?.length > 0 && <>
                        <div className="owner-gallery-count">Tất cả hình ảnh <strong>{rental.images.length}</strong></div>
                        <div className="owner-detail-thumbnails">
                            {rental.images.map((image, index) => <button type="button" key={image.id}
                                className={selectedImage === image.imageUrl ? 'active' : ''}
                                onClick={() => setSelectedImage(image.imageUrl)}>
                                <img src={image.imageUrl} alt={`Ảnh nhà trọ ${index + 1}`} /><span>{index + 1}</span>
                            </button>)}
                        </div>
                    </>}
                </div>
                <article className="rental-public-info">
                    <span className="rental-public-type">{rental.rentalTypeName || 'Nhà trọ'}</span>
                    <h1>{rental.name}</h1>
                    <p className="rental-public-address">⌖ {address || 'Chưa cập nhật địa chỉ'}</p>
                    <p className="rental-public-description">{rental.description || 'Chưa có mô tả.'}</p>
                    <div className="rental-owner-box">
                        <span className="rental-owner-avatar">{rental.ownerAvatarUrl
                            ? <img src={rental.ownerAvatarUrl} alt="" /> : (rental.ownerName || 'C')[0]}</span>
                        <div><small>Chủ trọ</small><strong>{rental.ownerName || 'Chưa cập nhật'}</strong>
                            <b>{rental.ownerPhoneNumber || 'Chưa cập nhật số điện thoại'}</b></div>
                    </div>
                    <button type="button" className="rental-contact-button">Gửi yêu cầu thuê trọ</button>
                </article>
            </section>

            <section className="rental-public-section">
                <h2>Các loại phòng</h2>
                <div className="rental-public-room-types">
                    {rental.roomTypes?.map((type) => <article key={type.id}>
                        <div><h3>{type.name}</h3><strong>{formatPrice.format(type.monthlyPrice || 0)}<small>/tháng</small></strong></div>
                        <p>{type.area ? `${type.area} m²` : 'Chưa cập nhật diện tích'} · Tối đa {type.maxGuests || 0} người</p>
                        <div className="owner-detail-facilities">
                            {type.facilities?.map((facility) => <span key={facility.id}>
                                {facility.facilityName} × {facility.quantity}</span>)}
                        </div>
                        <h4>Phòng hiện có</h4>
                        <div className="owner-detail-room-list">
                            {type.rooms?.map((room) => {
                                const available = String(room.status).toUpperCase() === 'AVAILABLE';
                                return <button type="button" key={room.id}
                                    className={available ? 'rental-room-choice available' : 'rental-room-choice'}
                                    disabled={!available} onClick={() => chooseRoom(room, type)}>
                                    <b>{room.name}</b><i>{room.status || 'AVAILABLE'}</i>
                                </button>;
                            })}
                        </div>
                    </article>)}
                </div>
            </section>

            <section className="rental-public-section">
                <h2>Nội quy nhà trọ</h2>
                <p className="owner-house-rules">{rental.houseRules || 'Chưa cập nhật nội quy.'}</p>
            </section>

            {selectedRoom && (
                <div className="rental-request-modal" role="dialog" aria-modal="true" aria-labelledby="rental-request-title">
                    <button className="rental-modal-backdrop" type="button" aria-label="Đóng"
                        onClick={() => !requesting && setSelectedRoom(null)} />
                    <form className="rental-request-form" onSubmit={submitRentalRequest}>
                        <div className="rental-request-form-heading">
                            <div><span>YÊU CẦU THUÊ TRỌ</span><h2 id="rental-request-title">Chọn thời gian thuê</h2></div>
                            <button type="button" disabled={requesting} onClick={() => setSelectedRoom(null)}>×</button>
                        </div>
                        <div className="rental-selected-room">
                            <span>⌂</span><div><small>Phòng đã chọn</small><strong>{selectedRoom.name}</strong>
                                <p>{selectedRoom.roomTypeName} · {rental.name}</p></div>
                        </div>
                        <label>Mã phòng<input value={`#${selectedRoom.id}`} disabled /></label>
                        <div className="rental-request-date-grid">
                            <label>Ngày bắt đầu <b>*</b><input type="date" required min={today}
                                value={requestForm.startDate}
                                onChange={(e) => setRequestForm((current) => ({
                                    ...current, startDate: e.target.value,
                                    endDate: current.endDate && current.endDate <= e.target.value ? '' : current.endDate,
                                }))} /></label>
                            <label>Ngày kết thúc <b>*</b><input type="date" required
                                min={requestForm.startDate || today} value={requestForm.endDate}
                                onChange={(e) => setRequestForm((current) => ({ ...current, endDate: e.target.value }))} /></label>
                        </div>
                        {requestMessage && <div className={`rental-request-message${
                            requestMessage.startsWith('Gửi yêu cầu thuê thành công') ? ' success' : ''}`}>
                            {requestMessage}
                        </div>}
                        <p className="rental-request-note">Yêu cầu sẽ được gửi đến chủ trọ để xét duyệt. Phòng chỉ được xác nhận sau khi chủ trọ chấp thuận.</p>
                        <div className="rental-request-actions">
                            <button type="button" disabled={requesting} onClick={() => setSelectedRoom(null)}>Hủy</button>
                            <button type="submit" disabled={requesting}>
                                {requesting ? 'Đang gửi...' : 'Gửi yêu cầu thuê'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}

export default RentalDetail;
