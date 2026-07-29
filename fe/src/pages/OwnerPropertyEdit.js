import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import AccountMenuIcon from '../components/AccountMenuIcon';
import ChatNavLink from '../components/ChatNavLink';
import NotificationNavLink from '../components/NotificationNavLink';
import OwnerRentalRequestNavLink from '../components/OwnerRentalRequestNavLink';
import useAuth from '../hooks/useAuth';
import {
    addOwnerFacilities,
    addOwnerRooms,
    addOwnerRoomType,
    deleteOwnerFacility,
    deleteOwnerRoom,
    deleteOwnerRoomType,
    getOwnerPropertyDetail,
    updateOwnerFacility,
    updateOwnerProperty,
    updateOwnerRoomType,
} from '../services/ownerService';
import { getMyProfile } from '../services/userService';

const emptyForm = {
    name: '', rentalTypeName: '', description: '', city: '', ward: '',
    street: '', houseNumber: '', detailedAddress: '', houseRules: '',
};

const emptyRoomType = {
    name: '', area: '', monthlyPrice: '', maxGuests: 1,
    firstRoomName: '', firstFacilityName: '', firstFacilityQuantity: 1,
};

function OwnerPropertyEdit() {
    const { propertyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [roomTypes, setRoomTypes] = useState([]);
    const [newRoomType, setNewRoomType] = useState(emptyRoomType);
    const [roomDrafts, setRoomDrafts] = useState({});
    const [facilityDrafts, setFacilityDrafts] = useState({});
    const [busyAction, setBusyAction] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([getMyProfile(), getOwnerPropertyDetail(propertyId)])
            .then(([profileData, property]) => {
                if (!active) return;
                setProfile(profileData);
                setForm(Object.keys(emptyForm).reduce((result, field) => ({
                    ...result, [field]: property[field] || '',
                }), {}));
                setRoomTypes(property.roomTypes || []);
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [propertyId]);

    const displayName = profile?.fullName || user?.username || 'Chủ trọ';
    const initials = displayName.trim().split(/\s+/).slice(-2)
        .map((word) => word[0]).join('').toUpperCase();
    const updateField = ({ target: { name, value } }) =>
        setForm((current) => ({ ...current, [name]: value }));

    const refreshRoomTypes = async () => {
        const property = await getOwnerPropertyDetail(propertyId);
        setRoomTypes(property.roomTypes || []);
    };

    const runRoomAction = async (actionKey, successMessage, action) => {
        setBusyAction(actionKey);
        setError('');
        setMessage('');
        try {
            await action();
            await refreshRoomTypes();
            setMessage(successMessage);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    };

    const updateRoomTypeField = (roomTypeId, field, value) =>
        setRoomTypes((current) => current.map((type) => type.id === roomTypeId
            ? { ...type, [field]: value } : type));

    const updateFacilityField = (roomTypeId, facilityId, field, value) =>
        setRoomTypes((current) => current.map((type) => type.id === roomTypeId
            ? {
                ...type,
                facilities: type.facilities.map((facility) => facility.id === facilityId
                    ? { ...facility, [field]: value } : facility),
            } : type));

    const saveRoomType = (type) => runRoomAction(
        `type-${type.id}`, 'Cập nhật loại phòng thành công.',
        () => updateOwnerRoomType(type.id, {
            name: type.name.trim(),
            area: type.area ? Number(type.area) : null,
            monthlyPrice: Number(type.monthlyPrice),
            maxGuests: Number(type.maxGuests),
        }),
    );

    const createRoomType = () => runRoomAction(
        'new-type', 'Thêm loại phòng thành công.',
        async () => {
            await addOwnerRoomType(propertyId, {
                name: newRoomType.name.trim(),
                area: newRoomType.area ? Number(newRoomType.area) : null,
                monthlyPrice: Number(newRoomType.monthlyPrice),
                maxGuests: Number(newRoomType.maxGuests),
                rooms: [{ name: newRoomType.firstRoomName.trim() }],
                facilities: [{
                    facilityName: newRoomType.firstFacilityName.trim(),
                    quantity: Number(newRoomType.firstFacilityQuantity),
                }],
            });
            setNewRoomType(emptyRoomType);
        },
    );

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = Object.keys(emptyForm).reduce((result, field) => ({
                ...result, [field]: form[field].trim(),
            }), {});
            await updateOwnerProperty(propertyId, payload);
            navigate(`/owner/properties/${propertyId}`, {
                replace: true,
                state: { message: 'Cập nhật nhà trọ thành công.' },
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
                <NavLink className="owner-profile" to="/profile">
                    <span className="owner-avatar">{profile?.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" /> : initials}</span>
                    <span><strong>{displayName}</strong><small>Chủ trọ</small></span>
                </NavLink>
                <nav>
                    <NavLink to="/owner/dashboard"><AccountMenuIcon name="home" />Tổng quan</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" />Thông tin cá nhân</NavLink>
                    <NavLink to="/owner/properties" className="active">
                        <AccountMenuIcon name="properties" />Danh sách phòng trọ
                    </NavLink>
                    <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" />Tạo phòng trọ</NavLink>
                    <OwnerRentalRequestNavLink icon={<AccountMenuIcon name="requests" />} />
                    <NavLink to="/owner/contracts"><AccountMenuIcon name="contract" />Hợp đồng thuê</NavLink>
                    <ChatNavLink />
                    <NotificationNavLink />
                </nav>
            </aside>

            <main className="owner-main">
                <div className="owner-create-heading">
                    <div><p>QUẢN LÝ NHÀ TRỌ</p><h1>Cập nhật nhà trọ</h1>
                        <span>Chỉnh sửa thông tin chung, địa chỉ và nội quy nhà trọ</span></div>
                    <NavLink to={`/owner/properties/${propertyId}`}>← Quay lại chi tiết</NavLink>
                </div>
                {error && <div className="profile-alert is-error" role="alert">{error}</div>}
                {message && <div className="profile-alert is-success" role="status">{message}</div>}
                {loading ? <div className="property-empty-state">Đang tải thông tin nhà trọ...</div> : (
                    <form className="owner-create-form" onSubmit={submit}>
                        <section className="owner-form-section">
                            <div className="owner-form-section-title"><span>1</span><div>
                                <h2>Thông tin cơ bản</h2><p>Cập nhật tên, loại hình và mô tả nhà trọ</p>
                            </div></div>
                            <div className="owner-form-grid">
                                <label className="span-2">Tên nhà trọ <b>*</b>
                                    <input required maxLength="150" name="name"
                                        value={form.name} onChange={updateField} /></label>
                                <label>Loại hình cho thuê <b>*</b>
                                    <select required name="rentalTypeName"
                                        value={form.rentalTypeName} onChange={updateField}>
                                        <option value="">Chọn loại hình</option>
                                        <option>Nhà trọ</option><option>Chung cư mini</option>
                                        <option>Căn hộ dịch vụ</option><option>Nhà nguyên căn</option>
                                        <option>Ký túc xá</option>
                                    </select></label>
                                <label className="span-3">Mô tả<textarea rows="4" maxLength="2000"
                                    name="description" value={form.description} onChange={updateField} /></label>
                            </div>
                        </section>

                        <section className="owner-form-section">
                            <div className="owner-form-section-title"><span>2</span><div>
                                <h2>Địa chỉ và nội quy</h2><p>Cập nhật vị trí và quy định của nhà trọ</p>
                            </div></div>
                            <div className="owner-form-grid">
                                <label>Tỉnh/Thành phố<input maxLength="100" name="city"
                                    value={form.city} onChange={updateField} /></label>
                                <label>Phường/Xã<input maxLength="100" name="ward"
                                    value={form.ward} onChange={updateField} /></label>
                                <label>Đường/Phố<input maxLength="100" name="street"
                                    value={form.street} onChange={updateField} /></label>
                                <label>Số nhà<input maxLength="50" name="houseNumber"
                                    value={form.houseNumber} onChange={updateField} /></label>
                                <label className="span-2">Địa chỉ chi tiết<input maxLength="255"
                                    name="detailedAddress" value={form.detailedAddress}
                                    onChange={updateField} /></label>
                            </div>
                            <label className="owner-rules-label">Nội quy nhà trọ<textarea rows="5"
                                maxLength="2000" name="houseRules" value={form.houseRules}
                                onChange={updateField} /></label>
                        </section>

                        <section className="owner-form-section">
                            <div className="owner-form-section-title"><span>3</span><div>
                                <h2>Cấu hình loại phòng</h2>
                                <p>Sửa thông số, quản lý tiện nghi và các phòng thuộc từng loại</p>
                            </div></div>

                            <div className="room-type-list">
                                {roomTypes.map((type) => (
                                    <article className="room-type-editor" key={type.id}>
                                        <div className="room-type-editor-heading">
                                            <h3>{type.name}</h3>
                                            <button type="button" className="danger"
                                                disabled={Boolean(busyAction)}
                                                onClick={() => {
                                                    if (window.confirm(`Xóa loại phòng “${type.name}”? Chỉ xóa được khi không có phòng đang thuê.`)) {
                                                        runRoomAction(
                                                            `delete-type-${type.id}`,
                                                            'Xóa loại phòng thành công.',
                                                            () => deleteOwnerRoomType(type.id),
                                                        );
                                                    }
                                                }}>Xóa loại phòng</button>
                                        </div>

                                        <h4 className="owner-form-subtitle">Thông số loại phòng</h4>
                                        <div className="owner-form-grid">
                                            <label>Tên loại phòng <b>*</b><input required maxLength="100"
                                                value={type.name} onChange={(event) =>
                                                    updateRoomTypeField(type.id, 'name', event.target.value)} /></label>
                                            <label>Diện tích (m²)<input min="0.1" step="0.1" type="number"
                                                value={type.area || ''} onChange={(event) =>
                                                    updateRoomTypeField(type.id, 'area', event.target.value)} /></label>
                                            <label>Giá thuê/tháng <b>*</b><input required min="1" type="number"
                                                value={type.monthlyPrice} onChange={(event) =>
                                                    updateRoomTypeField(type.id, 'monthlyPrice', event.target.value)} /></label>
                                            <label>Số người tối đa <b>*</b><input required min="1" type="number"
                                                value={type.maxGuests || 1} onChange={(event) =>
                                                    updateRoomTypeField(type.id, 'maxGuests', event.target.value)} /></label>
                                        </div>
                                        <button className="add-dynamic-button" type="button"
                                            disabled={Boolean(busyAction)}
                                            onClick={() => saveRoomType(type)}>
                                            {busyAction === `type-${type.id}` ? 'Đang lưu...' : 'Lưu thông số'}
                                        </button>

                                        <h4 className="owner-form-subtitle">Danh sách phòng</h4>
                                        <div className="owner-config-items">
                                            {type.rooms?.map((room) => {
                                                const rented = String(room.status).toUpperCase() === 'RENTED';
                                                return <div className="owner-config-row" key={room.id}>
                                                    <span><strong>{room.name}</strong>
                                                        <small>{rented ? 'Đang được thuê' : 'Phòng trống'}</small></span>
                                                    <button type="button" className="danger"
                                                        disabled={rented || Boolean(busyAction)}
                                                        title={rented ? 'Không thể xóa phòng đang được thuê' : 'Xóa phòng'}
                                                        onClick={() => {
                                                            if (window.confirm(`Xóa phòng “${room.name}”?`)) {
                                                                runRoomAction(
                                                                    `delete-room-${room.id}`,
                                                                    'Xóa phòng thành công.',
                                                                    () => deleteOwnerRoom(room.id),
                                                                );
                                                            }
                                                        }}>Xóa</button>
                                                </div>;
                                            })}
                                        </div>
                                        <div className="owner-inline-create">
                                            <input maxLength="100" placeholder="Tên phòng mới"
                                                value={roomDrafts[type.id] || ''}
                                                onChange={(event) => setRoomDrafts((current) => ({
                                                    ...current, [type.id]: event.target.value,
                                                }))} />
                                            <button type="button" disabled={Boolean(busyAction)
                                                || !roomDrafts[type.id]?.trim()}
                                                onClick={() => runRoomAction(
                                                    `add-room-${type.id}`,
                                                    'Thêm phòng thành công.',
                                                    async () => {
                                                        await addOwnerRooms(type.id, [{
                                                            name: roomDrafts[type.id].trim(),
                                                        }]);
                                                        setRoomDrafts((current) => ({
                                                            ...current, [type.id]: '',
                                                        }));
                                                    },
                                                )}>＋ Thêm phòng</button>
                                        </div>

                                        <h4 className="owner-form-subtitle">Tiện nghi</h4>
                                        <div className="owner-config-items">
                                            {type.facilities?.map((facility) => (
                                                <div className="owner-config-row facility" key={facility.id}>
                                                    <input maxLength="100" value={facility.facilityName}
                                                        onChange={(event) => updateFacilityField(
                                                            type.id, facility.id, 'facilityName', event.target.value,
                                                        )} />
                                                    <input type="number" min="1" value={facility.quantity}
                                                        onChange={(event) => updateFacilityField(
                                                            type.id, facility.id, 'quantity', event.target.value,
                                                        )} />
                                                    <button type="button" disabled={Boolean(busyAction)}
                                                        onClick={() => runRoomAction(
                                                            `facility-${facility.id}`,
                                                            'Cập nhật tiện nghi thành công.',
                                                            () => updateOwnerFacility(facility.id, {
                                                                facilityName: facility.facilityName.trim(),
                                                                quantity: Number(facility.quantity),
                                                            }),
                                                        )}>Lưu</button>
                                                    <button type="button" className="danger"
                                                        disabled={Boolean(busyAction)}
                                                        onClick={() => runRoomAction(
                                                            `delete-facility-${facility.id}`,
                                                            'Xóa tiện nghi thành công.',
                                                            () => deleteOwnerFacility(facility.id),
                                                        )}>Xóa</button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="owner-inline-create facility">
                                            <input maxLength="100" placeholder="Tên tiện nghi"
                                                value={facilityDrafts[type.id]?.facilityName || ''}
                                                onChange={(event) => setFacilityDrafts((current) => ({
                                                    ...current,
                                                    [type.id]: {
                                                        quantity: current[type.id]?.quantity || 1,
                                                        facilityName: event.target.value,
                                                    },
                                                }))} />
                                            <input type="number" min="1"
                                                value={facilityDrafts[type.id]?.quantity || 1}
                                                onChange={(event) => setFacilityDrafts((current) => ({
                                                    ...current,
                                                    [type.id]: {
                                                        facilityName: current[type.id]?.facilityName || '',
                                                        quantity: event.target.value,
                                                    },
                                                }))} />
                                            <button type="button" disabled={Boolean(busyAction)
                                                || !facilityDrafts[type.id]?.facilityName?.trim()}
                                                onClick={() => runRoomAction(
                                                    `add-facility-${type.id}`,
                                                    'Thêm tiện nghi thành công.',
                                                    async () => {
                                                        const draft = facilityDrafts[type.id];
                                                        await addOwnerFacilities(type.id, [{
                                                            facilityName: draft.facilityName.trim(),
                                                            quantity: Number(draft.quantity),
                                                        }]);
                                                        setFacilityDrafts((current) => ({
                                                            ...current, [type.id]: {
                                                                facilityName: '', quantity: 1,
                                                            },
                                                        }));
                                                    },
                                                )}>＋ Thêm tiện nghi</button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <article className="room-type-editor owner-new-room-type">
                                <div className="room-type-editor-heading"><h3>Thêm loại phòng mới</h3></div>
                                <div className="owner-form-grid">
                                    <label>Tên loại phòng <b>*</b><input maxLength="100"
                                        value={newRoomType.name} onChange={(event) =>
                                            setNewRoomType((current) => ({ ...current, name: event.target.value }))} /></label>
                                    <label>Diện tích (m²)<input min="0.1" step="0.1" type="number"
                                        value={newRoomType.area} onChange={(event) =>
                                            setNewRoomType((current) => ({ ...current, area: event.target.value }))} /></label>
                                    <label>Giá thuê/tháng <b>*</b><input min="1" type="number"
                                        value={newRoomType.monthlyPrice} onChange={(event) =>
                                            setNewRoomType((current) => ({ ...current, monthlyPrice: event.target.value }))} /></label>
                                    <label>Số người tối đa <b>*</b><input min="1" type="number"
                                        value={newRoomType.maxGuests} onChange={(event) =>
                                            setNewRoomType((current) => ({ ...current, maxGuests: event.target.value }))} /></label>
                                    <label>Tên phòng đầu tiên <b>*</b><input maxLength="100"
                                        value={newRoomType.firstRoomName} onChange={(event) =>
                                            setNewRoomType((current) => ({ ...current, firstRoomName: event.target.value }))} /></label>
                                    <label>Tiện nghi đầu tiên <b>*</b><input maxLength="100"
                                        value={newRoomType.firstFacilityName} onChange={(event) =>
                                            setNewRoomType((current) => ({ ...current, firstFacilityName: event.target.value }))} /></label>
                                    <label>Số lượng tiện nghi <b>*</b><input min="1" type="number"
                                        value={newRoomType.firstFacilityQuantity} onChange={(event) =>
                                            setNewRoomType((current) => ({
                                                ...current, firstFacilityQuantity: event.target.value,
                                            }))} /></label>
                                </div>
                                <button className="add-room-type-button" type="button"
                                    disabled={Boolean(busyAction) || !newRoomType.name.trim()
                                        || !newRoomType.monthlyPrice || !newRoomType.firstRoomName.trim()
                                        || !newRoomType.firstFacilityName.trim()}
                                    onClick={createRoomType}>
                                    {busyAction === 'new-type' ? 'Đang thêm...' : '＋ Thêm loại phòng'}
                                </button>
                            </article>
                        </section>

                        <div className="owner-form-actions">
                            <NavLink to={`/owner/properties/${propertyId}`}>Hủy bỏ</NavLink>
                            <button type="submit" disabled={saving}>
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}

export default OwnerPropertyEdit;
