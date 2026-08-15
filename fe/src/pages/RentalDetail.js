import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { createConversation } from '../services/conversationService';
import { createRentalRequest, createRentalReview, getRentalPropertyDetail, getRentalPropertyReviews } from '../services/rentalService';
import useAuth from '../hooks/useAuth';
import { userHasRole } from '../utils/authRouting';

const formatPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
});

function RentalDetail() {
    const { rentalPropertyId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [rental, setRental] = useState(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSubmitError, setReviewSubmitError] = useState('');
    const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [requestForm, setRequestForm] = useState({ startDate: '', endDate: '' });
    const [requesting, setRequesting] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [startingChat, setStartingChat] = useState(false);
    const [chatError, setChatError] = useState('');

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

    useEffect(() => {
        let active = true;
        setReviewsLoading(true);
        setReviewsError('');
        getRentalPropertyReviews(rentalPropertyId)
            .then((data) => {
                if (!active) return;
                setReviews(data);
            })
            .catch((requestError) => {
                if (!active) return;
                setReviewsError(requestError.message || 'Không thể tải đánh giá.');
            })
            .finally(() => {
                if (active) setReviewsLoading(false);
            });
        return () => { active = false; };
    }, [rentalPropertyId]);

    const address = rental?.detailedAddress || [
        rental?.houseNumber, rental?.street, rental?.ward, rental?.city,
    ].filter(Boolean).join(', ');

    const sortedReviews = useMemo(() => {
        return [...reviews].sort((a, b) => {
            const timeA = a?.createdAt ? Date.parse(a.createdAt) : 0;
            const timeB = b?.createdAt ? Date.parse(b.createdAt) : 0;
            return timeB - timeA;
        });
    }, [reviews]);
    const previewReviews = sortedReviews.slice(0, 3);
    const today = new Date().toISOString().slice(0, 10);

    const submitReview = async (event) => {
        event.preventDefault();
        if (!reviewComment.trim()) {
            setReviewSubmitError('Bạn cần nhập nội dung đánh giá.');
            return;
        }
        if (!isAuthenticated) {
            navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        setReviewSubmitting(true);
        setReviewSubmitError('');
        setReviewSubmitSuccess('');
        try {
            const message = await createRentalReview(rentalPropertyId, { comment: reviewComment.trim() });
            setReviewSubmitSuccess(message);
            setReviewComment('');
            const updatedReviews = await getRentalPropertyReviews(rentalPropertyId);
            setReviews(updatedReviews);
        } catch (requestError) {
            setReviewSubmitError(requestError.message || 'Không thể gửi đánh giá.');
        } finally {
            setReviewSubmitting(false);
        }
    };

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

    const startConversation = async () => {
        if (!isAuthenticated) {
            navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        if (!rental.ownerId) {
            setChatError('Không tìm thấy thông tin chủ trọ.');
            return;
        }

        setStartingChat(true);
        setChatError('');
        try {
            await createConversation(rental.ownerId);
            navigate('/chats', { state: { otherUserId: rental.ownerId } });
        } catch (requestError) {
            setChatError(requestError.message);
        } finally {
            setStartingChat(false);
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
                    <p className="rental-public-description">{rental.description || 'Chưa có mô tả.'}</p>
                    <div className="rental-owner-box">
                        <span className="rental-owner-avatar">{rental.ownerAvatarUrl
                            ? <img src={rental.ownerAvatarUrl} alt="" /> : (rental.ownerName || 'C')[0]}</span>
                        <div><small>Chủ trọ</small><strong>{rental.ownerName || 'Chưa cập nhật'}</strong>
                            <b>{rental.ownerPhoneNumber || 'Chưa cập nhật số điện thoại'}</b></div>
                    </div>
                    <div className="rental-contact-panel">
                        <a
                            className="rental-location-focus"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <span className="rental-location-icon" aria-hidden="true">⌖</span>
                            <span>
                                <small>Địa chỉ nhà trọ</small>
                                <strong>{address || 'Chưa cập nhật địa chỉ'}</strong>
                            </span>
                        </a>
                        <button
                            type="button"
                            className="rental-chat-button"
                            disabled={startingChat || String(user?.userId) === String(rental.ownerId)}
                            onClick={startConversation}
                        >
                            <span aria-hidden="true">◌</span>
                            {startingChat ? 'Đang mở...' : 'Trò chuyện'}
                        </button>
                    </div>
                    {chatError && <p className="rental-chat-error" role="alert">{chatError}</p>}
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

            <section className="rental-public-section rental-review-section">
                <div className="review-section-heading">
                    <h2>Đánh giá</h2>
                    <span>{reviews.length} nhận xét</span>
                </div>

                <div className="review-write-box">
                    {isAuthenticated && userHasRole(user, 'CUSTOMER') ? (
                        <form className="review-form" onSubmit={submitReview}>
                            <label htmlFor="review-comment">Viết đánh giá của bạn</label>
                            <textarea
                                id="review-comment"
                                rows="4"
                                placeholder="Chia sẻ trải nghiệm của bạn về nhà trọ này..."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                            />
                            {reviewSubmitError && <p className="review-error" role="alert">{reviewSubmitError}</p>}
                            {reviewSubmitSuccess && <p className="review-success" role="status">{reviewSubmitSuccess}</p>}
                            <div className="review-form-actions">
                                <button type="submit" disabled={reviewSubmitting}>
                                    {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                            </div>
                        </form>
                    ) : isAuthenticated ? (
                        <p className="review-disabled">Chỉ tài khoản khách thuê mới có thể viết đánh giá.</p>
                    ) : (
                        <p className="review-disabled">
                            Vui lòng <button type="button" className="review-login-button" onClick={() => navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)}>đăng nhập</button> để viết đánh giá.
                        </p>
                    )}
                </div>

                <div className="review-preview-box">
                    <h3>Những đánh giá gần nhất</h3>
                    {reviewsLoading ? (
                        <p className="review-loading">Đang tải đánh giá...</p>
                    ) : reviewsError ? (
                        <p className="review-error" role="alert">{reviewsError}</p>
                    ) : reviews.length === 0 ? (
                        <p className="review-empty">Chưa có đánh giá nào cho nhà trọ này.</p>
                    ) : (
                        <div className="review-list">
                            {previewReviews.map((review, index) => (
                                <article className="review-card" key={`${review.reviewerName || 'review'}-${index}`}>
                                    <div className="review-card-header">
                                        <span>{(review.reviewerName || 'Người dùng')[0].toUpperCase()}</span>
                                        <div>
                                            <strong>{review.reviewerName || 'Người dùng'}</strong>
                                            <small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}</small>
                                        </div>
                                    </div>
                                    <p>{review.comment || 'Không có nội dung đánh giá.'}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                {reviews.length > 0 && (
                    <section className="review-detail-action">
                        <h3>Xem chi tiết tất cả đánh giá</h3>
                        <button type="button" className="review-show-more" onClick={() => navigate(`/phong-tro/${rentalPropertyId}/reviews`)}>
                            Xem chi tiết
                        </button>
                    </section>
                )}
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
                        {requestMessage && <div className={`rental-request-message${requestMessage.startsWith('Gửi yêu cầu thuê thành công') ? ' success' : ''}`}>
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
