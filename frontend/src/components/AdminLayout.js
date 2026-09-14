import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AccountNavigation from './AccountNavigation';

function AdminLayout({ title, description, actions, children }) {
    const { user } = useAuth();
    const name = user?.fullName || user?.username || 'Quản trị viên';
    const initials = name.trim().split(/\s+/).slice(-2).map((word) => word[0]).join('').toUpperCase();
    return (
        <div className="owner-dashboard admin-shell">
            <aside className="owner-sidebar admin-sidebar">
                <NavLink className="owner-profile admin-profile" to="/profile">
                    <span className="owner-avatar">{initials || 'A'}</span>
                    <span><strong>{name}</strong><small>Quản trị viên</small></span>
                </NavLink>
                <AccountNavigation user={user} />
            </aside>
            <section className="owner-main admin-workspace">
                <header className="owner-heading admin-page-header"><div><p>TRANG QUẢN LÝ ADMIN</p><h1>{title}</h1><span>{description}</span></div>{actions && <div>{actions}</div>}</header>
                {children}
            </section>
        </div>
    );
}

export default AdminLayout;
