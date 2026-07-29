import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
    changeMyPassword,
    getMyProfile,
    uploadAvatarImage,
    updateMyProfile,
} from '../services/userService';
import AccountMenuIcon from '../components/AccountMenuIcon';

function Icon({ name, size = 21 }) {
    const paths = {
        home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
        user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
        clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M9 11h6M9 15h4" /></>,
        chat: <><path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-4A9 9 0 1 1 21 12Z" /><path d="M8 10h8M8 14h5" /></>,
        bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
        camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4Z" /><circle cx="12" cy="13" r="3" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
        bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
        edit: <><path d="m4 20 4.5-1 10-10-3.5-3.5-10 10Z" /><path d="m13.8 6.7 3.5 3.5" /></>,
        info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            {paths[name]}
        </svg>
    );
}

const emptyProfile = {
    username: '',
    fullName: '',
    phoneNumber: '',
    citizenCode: '',
    avatarUrl: '',
    gender: '',
};

function valueOrEmpty(value) {
    return value == null ? '' : String(value);
}

function ProfileAvatar({ src, name, large = false }) {
    const initials = (name || 'U').trim().split(/\s+/).slice(-2)
        .map((part) => part[0]).join('').toUpperCase();
    return (
        <div className={large ? 'profile-avatar profile-avatar-large' : 'profile-avatar'}>
            {src ? <img src={src} alt={`Ảnh đại diện của ${name}`} /> : <span>{initials}</span>}
        </div>
    );
}

function Profile() {
    const { user, syncUser } = useAuth();
    const [profile, setProfile] = useState(emptyProfile);
    const [draft, setDraft] = useState(emptyProfile);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef(null);
    const [passwords, setPasswords] = useState({
        currentPassword: '', newPassword: '', confirmPassword: '',
    });

    useEffect(() => {
        let active = true;
        getMyProfile()
            .then((data) => {
                if (!active) return;
                const normalized = Object.keys(emptyProfile).reduce((result, key) => ({
                    ...result, [key]: valueOrEmpty(data?.[key]),
                }), {});
                setProfile(normalized);
                setDraft(normalized);
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const roleLabel = useMemo(() => {
        const role = profile.role || user?.role || user?.roles?.[0];
        return String(role || 'CUSTOMER').replace('ROLE_', '') === 'OWNER'
            ? 'Chủ trọ' : 'Khách hàng';
    }, [profile.role, user]);
    const isOwner = roleLabel === 'Chủ trọ';

    const updateDraft = (event) => {
        const { name, value } = event.target;
        setDraft((current) => ({ ...current, [name]: value }));
    };

    const startEditing = () => {
        setDraft(profile);
        setMessage('');
        setError('');
        setEditing(true);
    };

    const cancelEditing = () => {
        setDraft(profile);
        setEditing(false);
        setError('');
    };

    const saveProfile = async () => {
        setSaving(true);
        setMessage('');
        setError('');
        try {
            await updateMyProfile({
                username: draft.username.trim(),
                fullName: draft.fullName.trim(),
                phoneNumber: draft.phoneNumber.trim(),
                avatarUrl: draft.avatarUrl.trim(),
                gender: draft.gender || null,
            });
            const fresh = await getMyProfile();
            const normalized = Object.keys(emptyProfile).reduce((result, key) => ({
                ...result, [key]: valueOrEmpty(fresh?.[key]),
            }), {});
            setProfile(normalized);
            setDraft(normalized);
            setEditing(false);
            setMessage('Đã cập nhật thông tin cá nhân.');
            await syncUser(false).catch(() => {});
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const submitPassword = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Mật khẩu xác nhận chưa khớp.');
            return;
        }
        setSaving(true);
        try {
            await changeMyPassword(passwords);
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPassword(false);
            setMessage('Đổi mật khẩu thành công.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const selectAvatar = () => {
        if (!uploadingAvatar) {
            avatarInputRef.current?.click();
        }
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn đúng định dạng tệp ảnh.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Ảnh đại diện không được vượt quá 5 MB.');
            return;
        }

        setUploadingAvatar(true);
        setError('');
        setMessage('');
        try {
            const avatarUrl = await uploadAvatarImage(file);
            await updateMyProfile({
                username: profile.username,
                fullName: profile.fullName,
                phoneNumber: profile.phoneNumber,
                avatarUrl,
                gender: profile.gender || null,
            });
            const updated = { ...profile, avatarUrl };
            setProfile(updated);
            setDraft(updated);
            setMessage('Đã cập nhật ảnh đại diện.');
            await syncUser(false).catch(() => {});
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const fields = [
        ['fullName', 'Họ và tên'],
        ['username', 'Tên đăng nhập'],
        ['phoneNumber', 'Số điện thoại'],
        ['citizenCode', 'CCCD'],
        ['gender', 'Giới tính'],
    ];

    return (
        <div className="profile-shell">
            <aside className="profile-sidebar">
                <div className="profile-sidebar-user">
                    <ProfileAvatar src={profile.avatarUrl} name={profile.fullName} />
                    <div><strong>{profile.fullName || user?.username || 'Người dùng'}</strong><span>{roleLabel}</span></div>
                </div>
                <nav aria-label="Menu tài khoản">
                    <NavLink to={isOwner ? '/owner/dashboard' : '/dashboard'}>
                        <AccountMenuIcon name="home" /> {isOwner ? 'Tổng quan' : 'Trang chủ'}
                    </NavLink>
                    <NavLink to="/profile" className="active"><AccountMenuIcon name="profile" /> Thông tin cá nhân</NavLink>
                    {isOwner && <NavLink to="/owner/properties"><AccountMenuIcon name="properties" /> Danh sách phòng trọ</NavLink>}
                    {isOwner && <NavLink to="/owner/properties/new"><AccountMenuIcon name="add" /> Tạo phòng trọ</NavLink>}
                    <NavLink to={isOwner ? '/owner/rental-requests' : '/yeu-cau-thue-tro'}><AccountMenuIcon name="requests" /> Yêu cầu thuê trọ</NavLink>
                    {isOwner && <a href="#contracts"><AccountMenuIcon name="contract" /> Hợp đồng thuê</a>}
                    <NavLink to="/chats"><AccountMenuIcon name="chat" /> Trò chuyện</NavLink>
                    <NavLink to="/notifications"><AccountMenuIcon name="notifications" /> Thông báo</NavLink>
                </nav>
            </aside>

            <main className="profile-main">
                <header className="profile-title">
                    <h1>Thông tin cá nhân</h1>
                    <p>Quản lý và cập nhật hồ sơ của bạn</p>
                </header>

                {(message || error) && (
                    <div className={`profile-alert ${error ? 'is-error' : 'is-success'}`} role="status">
                        {error || message}
                    </div>
                )}

                <div className="profile-content-grid">
                    <section className="profile-summary-card">
                        <div
                            className={`profile-avatar-wrap profile-avatar-picker${uploadingAvatar ? ' is-uploading' : ''}`}
                            onClick={selectAvatar}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') selectAvatar();
                            }}
                            role="button"
                            tabIndex="0"
                            aria-label="Chọn ảnh đại diện mới"
                        >
                            <ProfileAvatar large src={profile.avatarUrl} name={profile.fullName} />
                            <span className="profile-avatar-overlay">
                                <Icon name="camera" size={22} />
                                {uploadingAvatar ? 'Đang tải...' : 'Đổi ảnh'}
                            </span>
                            <span className="profile-camera-badge"><Icon name="camera" size={18} /></span>
                        </div>
                        <input
                            ref={avatarInputRef}
                            className="profile-file-input"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={handleAvatarChange}
                        />
                        <h2>{profile.fullName || 'Người dùng'}</h2>
                        <span className="profile-role">{roleLabel}</span>
                        <p className="profile-joined"><Icon name="calendar" size={17} /> Tài khoản đang hoạt động</p>
                        <button className="profile-outline-button" type="button" disabled={uploadingAvatar} onClick={selectAvatar}>
                            {uploadingAvatar ? 'Đang tải ảnh...' : 'Chọn ảnh từ thiết bị'}
                        </button>
                    </section>

                    <section className="profile-details-card">
                        <div className="profile-card-heading">
                            <h2>Thông tin cá nhân</h2>
                            {!editing && <button type="button" onClick={startEditing}>Chỉnh sửa</button>}
                        </div>
                        {loading ? <div className="profile-loading">Đang tải thông tin...</div> : (
                            <div className="profile-fields">
                                {fields.map(([name, label]) => {
                                    const editable = name !== 'citizenCode';
                                    return (
                                        <label key={name} className={!editable ? 'is-readonly' : ''}>
                                            <span>{label}</span>
                                            {editing && editable ? (
                                                name === 'gender' ? (
                                                    <select name={name} value={draft[name]} onChange={updateDraft}>
                                                        <option value="">Chưa cập nhật</option>
                                                        <option value="MALE">Nam</option>
                                                        <option value="FEMALE">Nữ</option>
                                                    </select>
                                                ) : <input name={name} value={draft[name]} onChange={updateDraft} />
                                            ) : (
                                                <strong>{name === 'gender'
                                                    ? ({ MALE: 'Nam', FEMALE: 'Nữ' }[profile[name]] || 'Chưa cập nhật')
                                                    : (profile[name] || 'Chưa cập nhật')}</strong>
                                            )}
                                            {editable && !editing && <Icon name="edit" size={18} />}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        <div className="profile-account">
                            <h2>Thông tin tài khoản</h2>
                            <div><span>Mật khẩu</span><strong>••••••••••••</strong>
                                <button type="button" onClick={() => setShowPassword((current) => !current)}>Đổi mật khẩu</button>
                            </div>
                        </div>
                    </section>
                </div>

                {editing && (
                    <div className="profile-actions">
                        <button type="button" className="secondary" onClick={cancelEditing}>Hủy</button>
                        <button type="button" className="primary" disabled={saving} onClick={saveProfile}>
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                )}

                {showPassword && (
                    <form className="profile-password-card" onSubmit={submitPassword}>
                        <div className="profile-password-heading">
                            <h2>Đổi mật khẩu</h2>
                            <button
                                type="button"
                                className="password-visibility-button"
                                onClick={() => setPasswordVisible((current) => !current)}
                            >
                                {passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            </button>
                        </div>
                        <div>
                            <label>Mật khẩu hiện tại<input type={passwordVisible ? 'text' : 'password'} required value={passwords.currentPassword}
                                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label>
                            <label>Mật khẩu mới<input type={passwordVisible ? 'text' : 'password'} required minLength="6" value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></label>
                            <label>Xác nhận mật khẩu<input type={passwordVisible ? 'text' : 'password'} required minLength="6" value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} /></label>
                        </div>
                        <button type="submit" disabled={saving}>Xác nhận đổi mật khẩu</button>
                    </form>
                )}

                <section className="profile-emergency-card">
                    <h2>Thông tin liên hệ khẩn cấp</h2>
                    <div className="profile-empty-contact">
                        <Icon name="info" size={18} />
                        Tính năng liên hệ khẩn cấp sẽ được bổ sung khi hệ thống hỗ trợ lưu dữ liệu này.
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Profile;
