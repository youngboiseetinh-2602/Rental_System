import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getRentalPropertyDetail, getRentalPropertyReviews, updateRentalReview, deleteRentalReview } from '../services/rentalService';

function ReviewDetail() {
    const { rentalPropertyId } = useParams();
    const [rental, setRental] = useState(null);
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editedComment, setEditedComment] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const currentUserId = user?.id || user?.userId || user?.sub || null;

    const refreshReviews = async () => {
        setReviewsLoading(true);
        setReviewsError('');
        try {
            const updatedReviews = await getRentalPropertyReviews(rentalPropertyId);
            setReviews(updatedReviews);
        } catch (requestError) {
            setReviewsError(requestError.message || 'Không thể tải đánh giá.');
        } finally {
            setReviewsLoading(false);
        }
    };

    const startEditReview = (review) => {
        setEditingReviewId(review.id);
        setEditedComment(review.comment || '');
        setActionError('');
        setActionSuccess('');
    };

    const cancelEditReview = () => {
        setEditingReviewId(null);
        setEditedComment('');
        setActionError('');
    };

    const saveReview = async (reviewId) => {
        if (!editedComment.trim()) {
            setActionError('Nội dung đánh giá không được để trống.');
            return;
        }
        setActionLoading(true);
        setActionError('');
        setActionSuccess('');
        try {
            await updateRentalReview(reviewId, { comment: editedComment.trim() });
            await refreshReviews();
            setEditingReviewId(null);
            setEditedComment('');
            setActionSuccess('Cập nhật đánh giá thành công.');
        } catch (requestError) {
            setActionError(requestError.message || 'Không thể cập nhật đánh giá.');
        } finally {
            setActionLoading(false);
        }
    };

    const removeReview = async (reviewId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            return;
        }
        setActionLoading(true);
        setActionError('');
        setActionSuccess('');
        try {
            await deleteRentalReview(reviewId);
            await refreshReviews();
            setActionSuccess('Đã xóa đánh giá.');
        } catch (requestError) {
            setActionError(requestError.message || 'Không thể xóa đánh giá.');
        } finally {
            setActionLoading(false);
            if (editingReviewId === reviewId) {
                setEditingReviewId(null);
                setEditedComment('');
            }
        }
    };

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        Promise.all([
            getRentalPropertyDetail(rentalPropertyId),
            getRentalPropertyReviews(rentalPropertyId),
        ])
            .then(([rentalData, reviewsData]) => {
                if (!active) return;
                setRental(rentalData);
                setReviews(reviewsData);
            })
            .catch((requestError) => {
                if (!active) return;
                setError(requestError.message || 'Không thể tải thông tin đánh giá.');
            })
            .finally(() => {
                if (!active) return;
                setLoading(false);
                setReviewsLoading(false);
            });
        return () => { active = false; };
    }, [rentalPropertyId]);


    const sortedReviews = useMemo(() => {
        return [...reviews].sort((a, b) => {
            const timeA = a?.createdAt ? Date.parse(a.createdAt) : 0;
            const timeB = b?.createdAt ? Date.parse(b.createdAt) : 0;
            return timeB - timeA;
        });
    }, [reviews]);

    if (loading) {
        return <div className="rental-detail-status">Đang tải đánh giá...</div>;
    }

    if (error || !rental) {
        return (
            <div className="rental-detail-status is-error">
                {error || 'Không tìm thấy nhà trọ.'}
                <NavLink to={`/phong-tro/${rentalPropertyId}`}>Quay lại chi tiết nhà trọ</NavLink>
            </div>
        );
    }

    return (
        <main className="owner-property-detail-page">
            <div className="rental-detail-breadcrumb">
                <NavLink to="/phong-tro">Phòng trọ</NavLink><span>›</span>
                <NavLink to={`/phong-tro/${rentalPropertyId}`}>{rental.name}</NavLink><span>›</span>
                <b>Đánh giá</b>
            </div>
            <section className="owner-detail-section">
                <div className="owner-panel-title review-summary-header">
                    <div>
                        <h2>Đánh giá cho {rental.name}</h2>
                        <span>{reviews.length} nhận xét</span>
                    </div>
                    <NavLink to={`/phong-tro/${rentalPropertyId}`} className="review-detail-back-link">
                        Trở lại chi tiết phòng trọ
                    </NavLink>
                </div>

                {reviewsLoading ? (
                    <p className="review-loading">Đang tải đánh giá...</p>
                ) : reviewsError ? (
                    <p className="review-error" role="alert">{reviewsError}</p>
                ) : reviews.length === 0 ? (
                    <p className="review-empty">Chưa có đánh giá nào cho nhà trọ này.</p>
                ) : (
                    <div className="review-list">
                        {actionError && <p className="review-error" role="alert">{actionError}</p>}
                        {actionSuccess && <p className="review-success" role="status">{actionSuccess}</p>}
                        {sortedReviews.map((review) => {
                            const isOwner = currentUserId && review.reviewerId === currentUserId;
                            const isEditing = editingReviewId === review.id;
                            return (
                                <article className="review-card" key={review.id || `${review.reviewerName || 'review'}-${review.createdAt}`}>
                                    <div className="review-card-header">
                                        <span>{(review.reviewerName || 'Người dùng')[0].toUpperCase()}</span>
                                        <div>
                                            <strong>{review.reviewerName || 'Người dùng'}</strong>
                                            <small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}</small>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <div className="review-edit-box">
                                            <textarea
                                                value={editedComment}
                                                onChange={(event) => setEditedComment(event.target.value)}
                                                rows={4}
                                            />
                                            <div className="review-edit-actions">
                                                <button type="button" disabled={actionLoading} onClick={() => saveReview(review.id)}>
                                                    Lưu
                                                </button>
                                                <button type="button" disabled={actionLoading} onClick={cancelEditReview}>
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p>{review.comment || 'Không có nội dung đánh giá.'}</p>
                                            {isOwner && (
                                                <div className="review-card-actions">
                                                    <button
                                                        type="button"
                                                        className="review-action-button"
                                                        onClick={() => startEditReview(review)}
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="review-action-button review-action-danger"
                                                        disabled={actionLoading}
                                                        onClick={() => removeReview(review.id)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}

export default ReviewDetail;
