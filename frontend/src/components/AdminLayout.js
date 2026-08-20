import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AccountMenuIcon from './AccountMenuIcon';

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
                <nav>
                    <NavLink to="/admin" end><AccountMenuIcon name="home" />Tổng quan</NavLink>
                    <NavLink to="/profile"><AccountMenuIcon name="profile" />Thông tin cá nhân</NavLink>
                    <NavLink to="/admin/users"><AccountMenuIcon name="requests" />Danh sách người dùng</NavLink>
                    <NavLink to="/admin/properties"><AccountMenuIcon name="properties" />Danh sách phòng trọ</NavLink>
                    <NavLink to="/admin/rental-types"><AccountMenuIcon name="properties" />Loại hình cho thuê</NavLink>
                </nav>
            </aside>
            <section className="owner-main admin-workspace">
                <header className="owner-heading admin-page-header"><div><p>TRANG QUẢN LÝ ADMIN</p><h1>{title}</h1><span>{description}</span></div>{actions && <div>{actions}</div>}</header>
                {children}
            </section>
        </div>
    );
}

export default AdminLayout;
