import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const navigation = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Phòng trọ', to: '/phong-tro' },
    { label: 'Tin tức', to: '/tin-tuc' },
    { label: 'Về chúng tôi', to: '/ve-chung-toi' },
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

    return (
        <header className="site-header">
            <div className="header-inner container-fluid">
                <NavLink className="brand" to="/" onClick={() => setOpen(false)}>
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
                            to={item.to}
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={() => setOpen(false)}
                            style={{ fontSize: '1.1rem' }}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="auth-actions">
                    <NavLink className="login-link" to="/login">Đăng nhập</NavLink>
                    <NavLink className="register-link" to="/register">Đăng ký</NavLink>
                </div>
            </div>
        </header>
    );
}

export default Header;
