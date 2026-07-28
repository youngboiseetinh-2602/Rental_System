import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import useAuth from '../hooks/useAuth';
import { createOwnerProperty, uploadPropertyImage } from '../services/ownerService';
import { getMyProfile } from '../services/userService';

const initialForm = {
    name: '', rentalTypeName: '', description: '', city: '', ward: '',
    street: '', houseNumber: '', detailedAddress: '', houseRules: '',
};

const createEmptyRoomType = () => ({
    name: '',
    area: '',
    monthlyPrice: '',
    maxGuests: '1',
    rooms: [{ name: '' }],
    facilities: [{ facilityName: '', quantity: 1 }],
});

function OwnerPropertyCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [roomTypes, setRoomTypes] = useState([createEmptyRoomType()]);
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getMyProfile().then(setProfile).catch(() => {});
    }, []);

    const displayName = profile?.fullName || user?.username || 'Chủ trọ';
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((word) => word[0]).join('').toUpperCase();
    const updateField = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };
    const updateRoomType = (typeIndex, field, value) => setRoomTypes((current) =>
        current.map((type, index) => index === typeIndex
            ? { ...type, [field]: value } : type));
    const updateRoomTypeItem = (typeIndex, listName, itemIndex, field, value) =>
        setRoomTypes((current) => current.map((type, index) => {
            if (index !== typeIndex) return type;
            return {
                ...type,
                [listName]: type[listName].map((item, nestedIndex) =>
                    nestedIndex === itemIndex ? { ...item, [field]: value } : item),
            };
        }));
    const addRoomTypeItem = (typeIndex, listName, item) =>
        setRoomTypes((current) => current.map((type, index) => index === typeIndex
            ? { ...type, [listName]: [...type[listName], item] } : type));
    const removeRoomTypeItem = (typeIndex, listName, itemIndex) =>
        setRoomTypes((current) => current.map((type, index) => index === typeIndex
            ? { ...type, [listName]: type[listName].filter((_, nestedIndex) => nestedIndex !== itemIndex) }
            : type));
    const chooseImages = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length) return;
        if (imageUrls.length + files.length > 10) {
            setError('Mỗi nhà trọ được tải tối đa 10 ảnh.');
            return;
        }
        const invalidFile = files.find((file) =>
            !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024);
        if (invalidFile) {
            setError('Mỗi tệp phải là ảnh PNG, JPG, WEBP hoặc GIF và không vượt quá 5 MB.');
            return;
        }
        setUploadingImages(true);
        setError('');
        try {
            const uploadedUrls = await Promise.all(files.map(uploadPropertyImage));
            setImageUrls((current) => [...current, ...uploadedUrls]);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setUploadingImages(false);
        }
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                name: form.name.trim(),
                rentalTypeName: form.rentalTypeName.trim(),
                description: form.description.trim(),
                city: form.city.trim(),
                ward: form.ward.trim(),
                street: form.street.trim(),
                houseNumber: form.houseNumber.trim(),
                detailedAddress: form.detailedAddress.trim(),
                houseRules: form.houseRules.trim(),
                imageUrls,
                roomTypes: roomTypes.map((type) => ({
                    name: type.name.trim(),
                    area: type.area ? Number(type.area) : null,
                    monthlyPrice: Number(type.monthlyPrice),
                    maxGuests: Number(type.maxGuests),
                    facilities: type.facilities.map((item) => ({
                        facilityName: item.facilityName.trim(),
                        quantity: Number(item.quantity),
                    })),
                    rooms: type.rooms.map((room) => ({ name: room.name.trim() })),
                })),
            };
            await createOwnerProperty(payload);
            navigate('/owner/properties', {
                replace: true,
                state: { message: 'Tạo nhà trọ thành công.' },
            });
        } catch (requestError) {
            setError(requestError.message);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="owner-dashboard owner-create-page">
            <aside className="owner-sidebar">
                <NavLink className="owner-brand" to="/owner/dashboard">⌂ <span>RentalRoom</span></NavLink>
                <NavLink className="owner-profile" to="/profile">
                    <span className="owner-avatar">{profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" /> : initials}</span>
                    <span><strong>{displayName}</strong><small>Chủ trọ</small></span>
                </NavLink>
                <nav>
                    <NavLink to="/owner/dashboard"><span className="owner-menu-icon">⌂</span>Tổng quan</NavLink>
                    <NavLink to="/profile"><span className="owner-menu-icon">♙</span>Thông tin cá nhân</NavLink>
                    <NavLink to="/owner/properties"><span className="owner-menu-icon">▤</span>Danh sách phòng trọ</NavLink>
                    <NavLink to="/owner/properties/new" end><span className="owner-menu-icon">＋</span>Tạo phòng trọ</NavLink>
                    <OwnerRentalRequestNavLink icon={<span className="owner-menu-icon">□</span>} />
                    <a href="#contracts"><span className="owner-menu-icon">▣</span>Hợp đồng thuê</a>
                    <a href="#messages"><span className="owner-menu-icon">◌</span>Trò chuyện</a>
                    <NavLink to="/notifications"><span className="owner-menu-icon">♢</span>Thông báo</NavLink>
                </nav>
            </aside>

            <main className="owner-main">
                <div className="owner-create-heading">
                    <div><p>QUẢN LÝ NHÀ TRỌ</p><h1>Tạo nhà trọ mới</h1>
                        <span>Điền đầy đủ thông tin để đăng nhà trọ lên hệ thống</span></div>
                    <NavLink to="/owner/properties">← Quay lại danh sách</NavLink>
                </div>
                {error && <div className="profile-alert is-error">{error}</div>}

                <form className="owner-create-form" onSubmit={submit}>
                    <section className="owner-form-section">
                        <div className="owner-form-section-title"><span>1</span><div>
                            <h2>Thông tin cơ bản</h2><p>Thông tin chung, địa chỉ, hình ảnh và nội quy nhà trọ</p></div></div>
                        <h3 className="owner-form-subtitle">Thông tin chung</h3>
                        <div className="owner-form-grid">
                            <label className="span-2">Tên nhà trọ <b>*</b>
                                <input required maxLength="150" name="name" value={form.name}
                                    onChange={updateField} placeholder="Ví dụ: Nhà trọ An Bình" /></label>
                            <label>Loại hình cho thuê <b>*</b>
                                <select required name="rentalTypeName" value={form.rentalTypeName} onChange={updateField}>
                                    <option value="">Chọn loại hình</option><option>Nhà trọ</option>
                                    <option>Chung cư mini</option><option>Căn hộ dịch vụ</option>
                                    <option>Nhà nguyên căn</option><option>Ký túc xá</option>
                                </select></label>
                            <label className="span-3">Mô tả
                                <textarea maxLength="2000" name="description" value={form.description}
                                    onChange={updateField} rows="4" placeholder="Mô tả vị trí, không gian và ưu điểm nổi bật..." /></label>
                        </div>

                        <h3 className="owner-form-subtitle">Địa chỉ nhà trọ</h3>
                        <div className="owner-form-grid">
                            <label>Tỉnh/Thành phố<input maxLength="100" name="city" value={form.city}
                                onChange={updateField} placeholder="Hà Nội" /></label>
                            <label>Phường/Xã<input maxLength="100" name="ward" value={form.ward}
                                onChange={updateField} placeholder="Phường Bách Khoa" /></label>
                            <label>Đường/Phố<input maxLength="100" name="street" value={form.street}
                                onChange={updateField} placeholder="Tạ Quang Bửu" /></label>
                            <label>Số nhà<input maxLength="50" name="houseNumber" value={form.houseNumber}
                                onChange={updateField} placeholder="Số 12, ngõ 34" /></label>
                            <label className="span-2">Địa chỉ chi tiết<input maxLength="255" name="detailedAddress"
                                value={form.detailedAddress} onChange={updateField}
                                placeholder="Số nhà, ngõ, đường, phường, thành phố" /></label>
                        </div>

                        <h3 className="owner-form-subtitle">Hình ảnh và nội quy</h3>
                        <div className="property-image-picker">
                            <label className={uploadingImages ? 'is-uploading' : ''}>
                                <span className="property-upload-icon">▧</span>
                                <strong>{uploadingImages ? 'Đang tải ảnh...' : 'Chọn ảnh nhà trọ'}</strong>
                                <small>Chọn nhiều ảnh PNG, JPG, WEBP hoặc GIF — tối đa 5 MB/ảnh</small>
                                <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif"
                                    disabled={uploadingImages} onChange={chooseImages} />
                            </label>
                            {imageUrls.length > 0 && (
                                <div className="property-image-preview-list">
                                    {imageUrls.map((url, index) => (
                                        <figure key={url}>
                                            <img src={url} alt={`Ảnh nhà trọ ${index + 1}`} />
                                            {index === 0 && <span>Ảnh bìa</span>}
                                            <button type="button" aria-label={`Xóa ảnh ${index + 1}`}
                                                onClick={() => setImageUrls((current) =>
                                                    current.filter((_, itemIndex) => itemIndex !== index))}>×</button>
                                        </figure>
                                    ))}
                                </div>
                            )}
                        </div>
                        <label className="owner-rules-label">Nội quy nhà trọ<textarea rows="4" maxLength="2000"
                            name="houseRules" value={form.houseRules} onChange={updateField}
                            placeholder="Giờ đóng cửa, quy định về khách, vệ sinh..." /></label>
                    </section>

                    <section className="owner-form-section">
                        <div className="owner-form-section-title"><span>2</span><div>
                            <h2>Chi tiết loại phòng</h2><p>Tạo một hoặc nhiều loại phòng cùng thông tin riêng</p></div></div>

                        <div className="room-type-list">
                            {roomTypes.map((type, typeIndex) => (
                                <article className="room-type-editor" key={typeIndex}>
                                    <div className="room-type-editor-heading">
                                        <h3>Loại phòng {typeIndex + 1}</h3>
                                        {roomTypes.length > 1 && (
                                            <button type="button" onClick={() => setRoomTypes((current) =>
                                                current.filter((_, index) => index !== typeIndex))}>Xóa loại phòng</button>
                                        )}
                                    </div>

                                    <h4 className="owner-form-subtitle">Thông số loại phòng</h4>
                                    <div className="owner-form-grid">
                                        <label>Tên loại phòng <b>*</b><input required maxLength="100"
                                            value={type.name} onChange={(e) => updateRoomType(typeIndex, 'name', e.target.value)}
                                            placeholder="Phòng tiêu chuẩn" /></label>
                                        <label>Diện tích (m²)<input min="0.1" step="0.1" type="number"
                                            value={type.area} onChange={(e) => updateRoomType(typeIndex, 'area', e.target.value)}
                                            placeholder="25" /></label>
                                        <label>Giá thuê/tháng (VNĐ) <b>*</b><input required min="1" type="number"
                                            value={type.monthlyPrice}
                                            onChange={(e) => updateRoomType(typeIndex, 'monthlyPrice', e.target.value)}
                                            placeholder="2500000" /></label>
                                        <label>Số người tối đa <b>*</b><input required min="1" type="number"
                                            value={type.maxGuests}
                                            onChange={(e) => updateRoomType(typeIndex, 'maxGuests', e.target.value)} /></label>
                                    </div>

                                    <h4 className="owner-form-subtitle">Danh sách phòng</h4>
                                    <div className="dynamic-field-list">
                                        {type.rooms.map((room, roomIndex) => <div key={roomIndex}>
                                            <label>Tên phòng {roomIndex + 1}<input required maxLength="100" value={room.name}
                                                onChange={(e) => updateRoomTypeItem(
                                                    typeIndex, 'rooms', roomIndex, 'name', e.target.value)}
                                                placeholder={`Phòng ${String(roomIndex + 1).padStart(2, '0')}`} /></label>
                                            {type.rooms.length > 1 && <button type="button"
                                                onClick={() => removeRoomTypeItem(typeIndex, 'rooms', roomIndex)}>Xóa</button>}
                                        </div>)}
                                    </div>
                                    <button className="add-dynamic-button" type="button"
                                        onClick={() => addRoomTypeItem(typeIndex, 'rooms', { name: '' })}>＋ Thêm phòng</button>

                                    <h4 className="owner-form-subtitle">Cơ sở vật chất</h4>
                                    <div className="dynamic-field-list">
                                        {type.facilities.map((facility, facilityIndex) => <div key={facilityIndex}>
                                            <label>Tên tiện ích<input required maxLength="100" value={facility.facilityName}
                                                onChange={(e) => updateRoomTypeItem(
                                                    typeIndex, 'facilities', facilityIndex, 'facilityName', e.target.value)}
                                                placeholder="Điều hòa, giường, tủ..." /></label>
                                            <label>Số lượng<input required min="1" type="number" value={facility.quantity}
                                                onChange={(e) => updateRoomTypeItem(
                                                    typeIndex, 'facilities', facilityIndex, 'quantity', e.target.value)} /></label>
                                            {type.facilities.length > 1 && <button type="button"
                                                onClick={() => removeRoomTypeItem(
                                                    typeIndex, 'facilities', facilityIndex)}>Xóa</button>}
                                        </div>)}
                                    </div>
                                    <button className="add-dynamic-button" type="button"
                                        onClick={() => addRoomTypeItem(
                                            typeIndex, 'facilities', { facilityName: '', quantity: 1 })}>
                                        ＋ Thêm tiện ích
                                    </button>
                                </article>
                            ))}
                        </div>
                        <button className="add-room-type-button" type="button"
                            onClick={() => setRoomTypes((current) => [...current, createEmptyRoomType()])}>
                            ＋ Thêm loại phòng khác
                        </button>
                    </section>

                    <div className="owner-form-actions">
                        <NavLink to="/owner/properties">Hủy bỏ</NavLink>
                        <button type="submit" disabled={saving || uploadingImages}>
                            {saving ? 'Đang tạo...' : uploadingImages ? 'Đang tải ảnh...' : 'Tạo nhà trọ'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default OwnerPropertyCreate;
