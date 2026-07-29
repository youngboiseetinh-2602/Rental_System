import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { defaultAuthenticatedRoute } from '../utils/authRouting';

const navigation = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Phòng trọ', to: '/phong-tro' },
    { label: 'Tin tức', to: '/tin-tuc' },
    { label: 'Về chúng tôi', to: '/about-us' },
];

function LogoIcon() {
    return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M7 22 24 7l17 15v18a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3Z" />
            <path d="M17 43V27h14v16M19 20h10" />
        </svg>
    );
}

function Header() {
    const [open, setOpen] = useState(false);
    const [logoutError, setLogoutError] = useState('');
    const {
        user,
        loading,
        loggingOut,
        isAuthenticated,
        logout,
    } = useAuth();

    const username = user?.fullName || user?.name || user?.username || user?.email;
    const roles = Array.isArray(user?.roles)
        ? user.roles
        : user?.role
            ? [user.role]
            : [];
    const primaryRole = roles[0]?.replace(/^ROLE_/, '');
    const homePath = isAuthenticated
        ? defaultAuthenticatedRoute(user)
        : '/';

    const handleLogout = async () => {
        setLogoutError('');

        try {
            await logout();
            setOpen(false);
            window.location.replace('/');
        } catch (error) {
            setLogoutError(error.message || 'Đăng xuất không thành công.');
        }
    };

    const renderAuthControls = (mobile = false) => {
        if (loading) {
            return (
                <span className="auth-status" role="status">
                    Đang kiểm tra...
                </span>
            );
        }

        if (!isAuthenticated) {
            return (
                <>
                    <NavLink
                        className="login-link"
                        to="/login"
                        onClick={() => setOpen(false)}
                    >
                        Đăng nhập
                    </NavLink>
                    <NavLink
                        className="register-link"
                        to="/register"
                        onClick={() => setOpen(false)}
                    >
                        Đăng ký
                    </NavLink>
                </>
            );
        }

        return (
            <>
                <NavLink className="auth-user" to="/profile" title={logoutError || undefined}>
                    <strong>{username || 'Người dùng'}</strong>
                    {primaryRole && <span>{primaryRole}</span>}
                    {logoutError && !mobile && (
                        <span className="auth-error" role="alert">
                            {logoutError}
                        </span>
                    )}
                </NavLink>
                <button
                    className="register-link logout-button"
                    type="button"
                    disabled={loggingOut}
                    onClick={handleLogout}
                >
                    {loggingOut ? 'Đang xuất...' : 'Đăng xuất'}
                </button>
            </>
        );
    };

    return (
        <header className="site-header">
            <div className="header-inner container-fluid">
                <NavLink className="brand" to={homePath} onClick={() => setOpen(false)}>
                    <LogoIcon />
                    <span>RentalRoom</span>
                </NavLink>

                <button
                    className="menu-toggle"
                    type="button"
                    aria-label="Mở menu"
                    aria-expanded={open}
                    onClick={() => setOpen((current) => !current)}
                >
                    <span />
                    <span />
                    <span />
                </button>

                <nav className={open ? 'main-nav is-open' : 'main-nav'}>
                    {navigation.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to === '/' ? homePath : item.to}
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    <div className="mobile-auth-actions">
                        {renderAuthControls(true)}
                    </div>
                </nav>

                <div className="auth-actions">
                    {renderAuthControls()}
                </div>
            </div>
        </header>
    );
}

export default Header;
